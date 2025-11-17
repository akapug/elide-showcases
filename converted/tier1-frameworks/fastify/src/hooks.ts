/**
 * Hook System for Fastify on Elide
 *
 * Comprehensive lifecycle hook management for request/response processing.
 * Hooks allow you to intercept and modify requests at different stages.
 *
 * Hook Lifecycle:
 * 1. onRequest    - Called when a request is received
 * 2. preParsing   - Called before body parsing
 * 3. preValidation - Called before route validation
 * 4. preHandler   - Called before route handler
 * 5. preSerialization - Called before response serialization
 * 6. onSend       - Called before sending response
 * 7. onResponse   - Called after response is sent
 * 8. onError      - Called when an error occurs
 * 9. onTimeout    - Called when request times out
 *
 * Hooks can be:
 * - Application-level (apply to all routes)
 * - Route-level (apply to specific routes)
 * - Plugin-level (apply within plugin scope)
 */

import { FastifyRequest, FastifyReply } from './fastify';

/**
 * Hook types
 */
export type HookType =
  | 'onRequest'
  | 'preParsing'
  | 'preValidation'
  | 'preHandler'
  | 'preSerialization'
  | 'onSend'
  | 'onResponse'
  | 'onError'
  | 'onTimeout';

/**
 * Hook handler function
 */
export type HookHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
  done?: (err?: Error) => void
) => Promise<void> | void;

/**
 * Error hook handler function
 */
export type ErrorHookHandler = (
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply,
  done?: (err?: Error) => void
) => Promise<void> | void;

/**
 * Hook execution context
 */
interface HookContext {
  handlers: HookHandler[];
  errorHandlers: ErrorHookHandler[];
}

/**
 * Hook Manager
 * Manages registration and execution of lifecycle hooks
 */
export class HookManager {
  private hooks: Map<HookType, HookHandler[]> = new Map();
  private errorHooks: ErrorHookHandler[] = [];

  constructor() {
    // Initialize hook arrays
    const hookTypes: HookType[] = [
      'onRequest',
      'preParsing',
      'preValidation',
      'preHandler',
      'preSerialization',
      'onSend',
      'onResponse',
      'onError',
      'onTimeout',
    ];

    hookTypes.forEach(type => {
      this.hooks.set(type, []);
    });
  }

  /**
   * Add a hook handler
   */
  public addHook(type: HookType, handler: HookHandler | ErrorHookHandler): void {
    if (type === 'onError') {
      this.errorHooks.push(handler as ErrorHookHandler);
    } else {
      const handlers = this.hooks.get(type);
      if (handlers) {
        handlers.push(handler as HookHandler);
      }
    }
  }

  /**
   * Run hooks of a specific type
   */
  public async runHooks(type: HookType, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const handlers = this.hooks.get(type);
    if (!handlers || handlers.length === 0) {
      return;
    }

    for (const handler of handlers) {
      // Check if reply was sent during a previous hook
      if (reply.sent && type !== 'onResponse') {
        return;
      }

      try {
        // Support both callback and promise-based hooks
        await new Promise<void>((resolve, reject) => {
          const result = handler(request, reply, (err?: Error) => {
            if (err) reject(err);
            else resolve();
          });

          // If handler returns a promise, use it
          if (result && typeof (result as Promise<void>).then === 'function') {
            (result as Promise<void>)
              .then(() => resolve())
              .catch(reject);
          } else if (result === undefined) {
            // If no done callback was called and no promise returned, assume sync completion
            resolve();
          }
        });
      } catch (error) {
        // Run error hooks
        await this.runErrorHooks(error as Error, request, reply);
        throw error;
      }
    }
  }

  /**
   * Run error hooks
   */
  public async runErrorHooks(error: Error, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (this.errorHooks.length === 0) {
      return;
    }

    for (const handler of this.errorHooks) {
      try {
        await new Promise<void>((resolve, reject) => {
          const result = handler(error, request, reply, (err?: Error) => {
            if (err) reject(err);
            else resolve();
          });

          if (result && typeof (result as Promise<void>).then === 'function') {
            (result as Promise<void>)
              .then(() => resolve())
              .catch(reject);
          } else if (result === undefined) {
            resolve();
          }
        });
      } catch (hookError) {
        // Log error in error hook, but don't throw
        console.error('Error in error hook:', hookError);
      }
    }
  }

  /**
   * Get all hooks of a specific type
   */
  public getHooks(type: HookType): HookHandler[] {
    if (type === 'onError') {
      return this.errorHooks as any[];
    }
    return this.hooks.get(type) || [];
  }

  /**
   * Clear all hooks
   */
  public clearHooks(): void {
    this.hooks.forEach(handlers => handlers.length = 0);
    this.errorHooks.length = 0;
  }

  /**
   * Clear hooks of a specific type
   */
  public clearHookType(type: HookType): void {
    if (type === 'onError') {
      this.errorHooks.length = 0;
    } else {
      const handlers = this.hooks.get(type);
      if (handlers) {
        handlers.length = 0;
      }
    }
  }

  /**
   * Clone hook manager (for plugin scoping)
   */
  public clone(): HookManager {
    const cloned = new HookManager();

    // Copy all hooks
    this.hooks.forEach((handlers, type) => {
      cloned.hooks.set(type, [...handlers]);
    });

    cloned.errorHooks = [...this.errorHooks];

    return cloned;
  }
}

/**
 * Hook utilities and helpers
 */
export class HookUtils {
  /**
   * Create a timing hook that logs request duration
   */
  static createTimingHook(): {
    onRequest: HookHandler;
    onResponse: HookHandler;
  } {
    const timings = new WeakMap<FastifyRequest, number>();

    return {
      onRequest: async (request: FastifyRequest, reply: FastifyReply) => {
        timings.set(request, Date.now());
      },
      onResponse: async (request: FastifyRequest, reply: FastifyReply) => {
        const startTime = timings.get(request);
        if (startTime) {
          const duration = Date.now() - startTime;
          request.log.info(`Request completed in ${duration}ms`);
        }
      },
    };
  }

  /**
   * Create a CORS hook
   */
  static createCORSHook(options: {
    origin?: string | string[];
    credentials?: boolean;
    methods?: string[];
    headers?: string[];
  } = {}): HookHandler {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const origin = options.origin || '*';
      const methods = options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
      const headers = options.headers || ['Content-Type', 'Authorization'];

      // Set CORS headers
      if (Array.isArray(origin)) {
        const requestOrigin = request.headers.origin as string;
        if (origin.includes(requestOrigin)) {
          reply.header('Access-Control-Allow-Origin', requestOrigin);
        }
      } else {
        reply.header('Access-Control-Allow-Origin', origin);
      }

      if (options.credentials) {
        reply.header('Access-Control-Allow-Credentials', 'true');
      }

      reply.header('Access-Control-Allow-Methods', methods.join(', '));
      reply.header('Access-Control-Allow-Headers', headers.join(', '));

      // Handle preflight
      if (request.method === 'OPTIONS') {
        reply.code(204).send();
      }
    };
  }

  /**
   * Create an authentication hook
   */
  static createAuthHook(validator: (token: string) => Promise<boolean> | boolean): HookHandler {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization as string;

      if (!authHeader) {
        reply.code(401).send({ error: 'Unauthorized', message: 'Missing authorization header' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');

      try {
        const isValid = await validator(token);
        if (!isValid) {
          reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token' });
        }
      } catch (error) {
        reply.code(401).send({ error: 'Unauthorized', message: 'Token validation failed' });
      }
    };
  }

  /**
   * Create a rate limiting hook
   */
  static createRateLimitHook(options: {
    max?: number;
    windowMs?: number;
  } = {}): HookHandler {
    const max = options.max || 100;
    const windowMs = options.windowMs || 60000; // 1 minute
    const requests = new Map<string, { count: number; resetTime: number }>();

    return async (request: FastifyRequest, reply: FastifyReply) => {
      const key = request.ip;
      const now = Date.now();

      let record = requests.get(key);

      if (!record || now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + windowMs,
        };
        requests.set(key, record);
      }

      record.count++;

      if (record.count > max) {
        reply
          .code(429)
          .header('Retry-After', String(Math.ceil((record.resetTime - now) / 1000)))
          .send({ error: 'Too Many Requests', message: 'Rate limit exceeded' });
        return;
      }

      // Add rate limit headers
      reply.header('X-RateLimit-Limit', String(max));
      reply.header('X-RateLimit-Remaining', String(Math.max(0, max - record.count)));
      reply.header('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
    };
  }

  /**
   * Create a request ID hook
   */
  static createRequestIdHook(generator?: () => string): HookHandler {
    const gen = generator || (() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

    return async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = gen();
      (request as any).id = requestId;
      reply.header('X-Request-Id', requestId);
    };
  }

  /**
   * Create a compression hook (basic implementation)
   */
  static createCompressionHook(): HookHandler {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const acceptEncoding = request.headers['accept-encoding'] as string;

      if (acceptEncoding?.includes('gzip')) {
        // In a real implementation, this would set up compression
        reply.header('Content-Encoding', 'gzip');
      }
    };
  }

  /**
   * Create a security headers hook
   */
  static createSecurityHeadersHook(options: {
    hsts?: boolean;
    noSniff?: boolean;
    xssProtection?: boolean;
    frameGuard?: boolean;
  } = {}): HookHandler {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (options.hsts !== false) {
        reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }

      if (options.noSniff !== false) {
        reply.header('X-Content-Type-Options', 'nosniff');
      }

      if (options.xssProtection !== false) {
        reply.header('X-XSS-Protection', '1; mode=block');
      }

      if (options.frameGuard !== false) {
        reply.header('X-Frame-Options', 'SAMEORIGIN');
      }
    };
  }

  /**
   * Create a polyglot hook that runs code in another language
   *
   * Example:
   * ```typescript
   * const hook = HookUtils.createPolyglotHook('python', `
   * def process(request):
   *     print(f"Processing request: {request.method} {request.url}")
   * `);
   * ```
   */
  static createPolyglotHook(language: 'python' | 'ruby', code: string): HookHandler {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // In production Elide runtime with polyglot support:
      /*
      const handler = Polyglot.eval(language, code);
      await handler.process(request);
      */

      // Mock implementation
      console.log(`[Polyglot Hook] Would execute ${language} code:`, code);
    };
  }
}

/**
 * Pre-built hook chains for common patterns
 */
export const HookChains = {
  /**
   * Standard API hooks (CORS + timing + request ID)
   */
  standardAPI: (): HookHandler[] => {
    const timing = HookUtils.createTimingHook();
    return [
      HookUtils.createCORSHook(),
      HookUtils.createRequestIdHook(),
      timing.onRequest,
    ];
  },

  /**
   * Secure API hooks (security headers + CORS + rate limiting)
   */
  secureAPI: (options?: { rateLimit?: { max: number; windowMs: number } }): HookHandler[] => {
    return [
      HookUtils.createSecurityHeadersHook(),
      HookUtils.createCORSHook(),
      HookUtils.createRateLimitHook(options?.rateLimit),
    ];
  },

  /**
   * Authenticated API hooks (auth + standard API)
   */
  authenticatedAPI: (validator: (token: string) => Promise<boolean>): HookHandler[] => {
    return [
      ...HookChains.standardAPI(),
      HookUtils.createAuthHook(validator),
    ];
  },
};
