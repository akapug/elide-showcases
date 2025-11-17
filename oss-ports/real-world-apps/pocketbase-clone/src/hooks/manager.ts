/**
 * Hooks Manager
 * Manages lifecycle hooks and custom endpoints
 */

import { EventEmitter } from 'events';
import { Collection } from '../collections/manager.js';

export type HookEvent =
  | 'before-create'
  | 'after-create'
  | 'before-update'
  | 'after-update'
  | 'before-delete'
  | 'after-delete'
  | 'before-auth'
  | 'after-auth';

export interface HookContext {
  collection: Collection;
  record?: any;
  data?: any;
  auth?: any;
  admin?: boolean;
  request?: any;
  response?: any;
}

export type HookHandler = (context: HookContext) => Promise<void | HookContext>;

export interface CustomEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: (request: any, response: any) => Promise<any>;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export class HooksManager extends EventEmitter {
  private hooks: Map<string, HookHandler[]> = new Map();
  private customEndpoints: Map<string, CustomEndpoint> = new Map();

  /**
   * Register a hook
   */
  on(event: HookEvent, collection: string, handler: HookHandler): void {
    const key = `${event}:${collection}`;
    const handlers = this.hooks.get(key) || [];
    handlers.push(handler);
    this.hooks.set(key, handlers);
  }

  /**
   * Register a global hook (applies to all collections)
   */
  onGlobal(event: HookEvent, handler: HookHandler): void {
    this.on(event, '*', handler);
  }

  /**
   * Unregister a hook
   */
  off(event: HookEvent, collection: string, handler: HookHandler): void {
    const key = `${event}:${collection}`;
    const handlers = this.hooks.get(key) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.hooks.set(key, handlers);
    }
  }

  /**
   * Execute hooks for an event
   */
  async executeHooks(event: HookEvent, collection: string, context: HookContext): Promise<HookContext> {
    let currentContext = context;

    // Execute collection-specific hooks
    const collectionKey = `${event}:${collection}`;
    const collectionHandlers = this.hooks.get(collectionKey) || [];

    for (const handler of collectionHandlers) {
      try {
        const result = await handler(currentContext);
        if (result) {
          currentContext = result;
        }
      } catch (error) {
        console.error(`Error in hook ${event} for ${collection}:`, error);
        throw error;
      }
    }

    // Execute global hooks
    const globalKey = `${event}:*`;
    const globalHandlers = this.hooks.get(globalKey) || [];

    for (const handler of globalHandlers) {
      try {
        const result = await handler(currentContext);
        if (result) {
          currentContext = result;
        }
      } catch (error) {
        console.error(`Error in global hook ${event}:`, error);
        throw error;
      }
    }

    return currentContext;
  }

  /**
   * Register a custom endpoint
   */
  registerEndpoint(endpoint: CustomEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`;
    this.customEndpoints.set(key, endpoint);
  }

  /**
   * Unregister a custom endpoint
   */
  unregisterEndpoint(method: string, path: string): void {
    const key = `${method}:${path}`;
    this.customEndpoints.delete(key);
  }

  /**
   * Get a custom endpoint
   */
  getEndpoint(method: string, path: string): CustomEndpoint | undefined {
    const key = `${method}:${path}`;
    return this.customEndpoints.get(key);
  }

  /**
   * Get all custom endpoints
   */
  getAllEndpoints(): CustomEndpoint[] {
    return Array.from(this.customEndpoints.values());
  }

  /**
   * Execute a custom endpoint
   */
  async executeEndpoint(method: string, path: string, request: any, response: any): Promise<any> {
    const endpoint = this.getEndpoint(method, path);
    if (!endpoint) {
      throw new Error(`Endpoint ${method} ${path} not found`);
    }

    return await endpoint.handler(request, response);
  }

  /**
   * Load hooks from JavaScript file
   */
  async loadHooksFromFile(filePath: string): Promise<void> {
    try {
      const module = await import(filePath);

      // Register hooks
      if (module.hooks) {
        for (const [event, handlers] of Object.entries(module.hooks)) {
          for (const [collection, handler] of Object.entries(handlers as any)) {
            this.on(event as HookEvent, collection, handler as HookHandler);
          }
        }
      }

      // Register custom endpoints
      if (module.endpoints) {
        for (const endpoint of module.endpoints) {
          this.registerEndpoint(endpoint);
        }
      }
    } catch (error) {
      console.error(`Error loading hooks from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get hook statistics
   */
  getStats(): { hooks: number; endpoints: number } {
    return {
      hooks: Array.from(this.hooks.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      endpoints: this.customEndpoints.size,
    };
  }
}

/**
 * Built-in hooks
 */
export class BuiltInHooks {
  /**
   * Auto-set timestamps on create/update
   */
  static autoTimestamps(): HookHandler {
    return async (context: HookContext) => {
      const now = new Date().toISOString();

      if (context.data) {
        if (!context.record) {
          // Before create
          context.data.created = now;
        }
        context.data.updated = now;
      }

      return context;
    };
  }

  /**
   * Auto-generate slug from title
   */
  static autoSlug(titleField: string = 'title', slugField: string = 'slug'): HookHandler {
    return async (context: HookContext) => {
      if (context.data && context.data[titleField] && !context.data[slugField]) {
        context.data[slugField] = context.data[titleField]
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      return context;
    };
  }

  /**
   * Validate required fields
   */
  static validateRequired(fields: string[]): HookHandler {
    return async (context: HookContext) => {
      if (!context.data) return context;

      const missing = fields.filter(field => !context.data![field]);
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      return context;
    };
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(fields: string[]): HookHandler {
    return async (context: HookContext) => {
      if (!context.data) return context;

      for (const field of fields) {
        if (context.data[field]) {
          // Basic HTML sanitization (use a library like DOMPurify in production)
          context.data[field] = context.data[field]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
        }
      }

      return context;
    };
  }

  /**
   * Log record changes
   */
  static logChanges(logFn: (message: string) => void): HookHandler {
    return async (context: HookContext) => {
      const action = context.record ? 'update' : 'create';
      const id = context.record?.id || 'new';
      logFn(`${action} record ${id} in ${context.collection.name}`);
      return context;
    };
  }

  /**
   * Trigger webhook on changes
   */
  static triggerWebhook(url: string): HookHandler {
    return async (context: HookContext) => {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection: context.collection.name,
            record: context.record,
            data: context.data,
          }),
        });
      } catch (error) {
        console.error('Error triggering webhook:', error);
      }
      return context;
    };
  }

  /**
   * Cache invalidation
   */
  static invalidateCache(cacheKey: string | ((context: HookContext) => string)): HookHandler {
    return async (context: HookContext) => {
      const key = typeof cacheKey === 'function' ? cacheKey(context) : cacheKey;
      console.log(`Invalidating cache: ${key}`);
      // Implement cache invalidation logic
      return context;
    };
  }

  /**
   * Rate limiting per user
   */
  static rateLimit(maxRequests: number, windowMs: number): HookHandler {
    const requests = new Map<string, number[]>();

    return async (context: HookContext) => {
      if (!context.auth) return context;

      const userId = context.auth.id;
      const now = Date.now();
      const userRequests = requests.get(userId) || [];

      // Clean old requests
      const validRequests = userRequests.filter(time => now - time < windowMs);

      if (validRequests.length >= maxRequests) {
        throw new Error('Rate limit exceeded');
      }

      validRequests.push(now);
      requests.set(userId, validRequests);

      return context;
    };
  }
}

/**
 * Example hooks configuration
 */
export const exampleHooks = {
  hooks: {
    'before-create': {
      posts: BuiltInHooks.autoSlug('title', 'slug'),
      '*': BuiltInHooks.autoTimestamps(),
    },
    'before-update': {
      '*': BuiltInHooks.autoTimestamps(),
    },
    'after-create': {
      posts: BuiltInHooks.logChanges(console.log),
    },
  },
  endpoints: [
    {
      method: 'GET' as const,
      path: '/custom/health',
      handler: async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
      },
    },
    {
      method: 'POST' as const,
      path: '/custom/webhook',
      handler: async (request: any) => {
        console.log('Webhook received:', request.body);
        return { received: true };
      },
    },
  ],
};
