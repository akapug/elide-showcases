/**
 * Plugin System for Fastify on Elide
 *
 * Comprehensive plugin architecture with encapsulation and dependency management.
 *
 * Features:
 * - Plugin registration and loading
 * - Encapsulation (plugins have their own context)
 * - Dependency management
 * - Plugin metadata and versioning
 * - Async plugin initialization
 * - Plugin decorators
 * - Plugin hooks
 *
 * Plugins allow you to:
 * - Extend Fastify with reusable functionality
 * - Organize code into modules
 * - Share plugins across projects
 * - Build plugin ecosystems
 */

import { FastifyInstance } from './fastify';

/**
 * Plugin function type
 */
export type PluginFunction = (
  instance: FastifyInstance,
  opts: PluginOptions
) => Promise<void> | void;

/**
 * Plugin options
 */
export interface PluginOptions {
  prefix?: string;
  [key: string]: any;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version?: string;
  dependencies?: string[];
  decorators?: {
    fastify?: string[];
    request?: string[];
    reply?: string[];
  };
}

/**
 * Registered plugin info
 */
interface RegisteredPlugin {
  fn: PluginFunction;
  opts: PluginOptions;
  metadata?: PluginMetadata;
  loaded: boolean;
}

/**
 * Plugin Manager
 * Manages plugin registration, loading, and lifecycle
 */
export class PluginManager {
  private plugins: RegisteredPlugin[] = [];
  private loadedPlugins: Set<string> = new Set();
  private instance: FastifyInstance;

  constructor(instance: FastifyInstance) {
    this.instance = instance;
  }

  /**
   * Register a plugin
   */
  public register(fn: PluginFunction, opts: PluginOptions = {}): void {
    // Extract metadata if available
    const metadata = (fn as any).metadata as PluginMetadata | undefined;

    this.plugins.push({
      fn,
      opts,
      metadata,
      loaded: false,
    });
  }

  /**
   * Load all registered plugins
   */
  public async loadPlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      if (!plugin.loaded) {
        await this.loadPlugin(plugin);
      }
    }
  }

  /**
   * Load a single plugin
   */
  private async loadPlugin(plugin: RegisteredPlugin): Promise<void> {
    // Check dependencies
    if (plugin.metadata?.dependencies) {
      for (const dep of plugin.metadata.dependencies) {
        if (!this.loadedPlugins.has(dep)) {
          throw new Error(`Plugin dependency not met: ${dep}`);
        }
      }
    }

    // Create encapsulated instance if needed
    const pluginInstance = plugin.opts.prefix
      ? this.createEncapsulatedInstance(plugin.opts.prefix)
      : this.instance;

    // Execute plugin function
    try {
      await plugin.fn(pluginInstance, plugin.opts);
      plugin.loaded = true;

      // Mark as loaded
      if (plugin.metadata?.name) {
        this.loadedPlugins.add(plugin.metadata.name);
      }
    } catch (error) {
      throw new Error(`Failed to load plugin: ${error}`);
    }
  }

  /**
   * Create encapsulated instance with prefix
   */
  private createEncapsulatedInstance(prefix: string): FastifyInstance {
    // Create a proxy that prefixes routes
    const original = this.instance;
    const encapsulated = Object.create(original) as FastifyInstance;

    // Override route methods to add prefix
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'all'];
    methods.forEach(method => {
      (encapsulated as any)[method] = (...args: any[]) => {
        const [path, ...rest] = args;
        return (original as any)[method](prefix + path, ...rest);
      };
    });

    encapsulated.prefix = prefix;
    return encapsulated;
  }

  /**
   * Get loaded plugin names
   */
  public getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins);
  }

  /**
   * Check if a plugin is loaded
   */
  public isPluginLoaded(name: string): boolean {
    return this.loadedPlugins.has(name);
  }
}

/**
 * Plugin factory helpers
 */
export class PluginFactory {
  /**
   * Create a plugin with metadata
   */
  static create(
    metadata: PluginMetadata,
    fn: PluginFunction
  ): PluginFunction {
    const plugin = fn as any;
    plugin.metadata = metadata;
    return plugin;
  }

  /**
   * Create a simple plugin
   */
  static simple(
    name: string,
    fn: (instance: FastifyInstance, opts: PluginOptions) => Promise<void> | void
  ): PluginFunction {
    return PluginFactory.create({ name }, fn);
  }

  /**
   * Create a plugin with dependencies
   */
  static withDependencies(
    name: string,
    dependencies: string[],
    fn: (instance: FastifyInstance, opts: PluginOptions) => Promise<void> | void
  ): PluginFunction {
    return PluginFactory.create({ name, dependencies }, fn);
  }
}

/**
 * Common Fastify plugins (built-in)
 */
export const CommonPlugins = {
  /**
   * CORS plugin
   */
  cors: (corsOptions?: {
    origin?: string | string[];
    credentials?: boolean;
    methods?: string[];
    headers?: string[];
  }) => {
    return PluginFactory.simple('cors', async (instance, opts) => {
      const options = { ...corsOptions, ...opts };
      const origin = options.origin || '*';
      const methods = options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
      const headers = options.headers || ['Content-Type', 'Authorization'];

      instance.addHook('onRequest', async (request, reply) => {
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

        if (request.method === 'OPTIONS') {
          reply.code(204).send();
        }
      });
    });
  },

  /**
   * Rate limiting plugin
   */
  rateLimit: (options?: {
    max?: number;
    windowMs?: number;
  }) => {
    return PluginFactory.simple('rate-limit', async (instance, opts) => {
      const max = options?.max || opts.max || 100;
      const windowMs = options?.windowMs || opts.windowMs || 60000;
      const requests = new Map<string, { count: number; resetTime: number }>();

      instance.addHook('onRequest', async (request, reply) => {
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

        reply.header('X-RateLimit-Limit', String(max));
        reply.header('X-RateLimit-Remaining', String(Math.max(0, max - record.count)));
        reply.header('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
      });
    });
  },

  /**
   * Helmet (security headers) plugin
   */
  helmet: (options?: {
    hsts?: boolean;
    noSniff?: boolean;
    xssProtection?: boolean;
    frameGuard?: boolean;
  }) => {
    return PluginFactory.simple('helmet', async (instance, opts) => {
      const config = { ...options, ...opts };

      instance.addHook('onRequest', async (request, reply) => {
        if (config.hsts !== false) {
          reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if (config.noSniff !== false) {
          reply.header('X-Content-Type-Options', 'nosniff');
        }

        if (config.xssProtection !== false) {
          reply.header('X-XSS-Protection', '1; mode=block');
        }

        if (config.frameGuard !== false) {
          reply.header('X-Frame-Options', 'SAMEORIGIN');
        }
      });
    });
  },

  /**
   * Authentication plugin
   */
  auth: (validator: (token: string) => Promise<boolean> | boolean) => {
    return PluginFactory.simple('auth', async (instance, opts) => {
      instance.decorateRequest('user', null);

      instance.addHook('preHandler', async (request, reply) => {
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
            return;
          }

          // Set user on request (would decode token in real implementation)
          (request as any).user = { token };
        } catch (error) {
          reply.code(401).send({ error: 'Unauthorized', message: 'Token validation failed' });
        }
      });
    });
  },

  /**
   * Static file serving plugin
   */
  static: (rootPath: string, options?: { prefix?: string }) => {
    return PluginFactory.simple('static', async (instance, opts) => {
      const prefix = options?.prefix || opts.prefix || '/';

      instance.get(`${prefix}*`, async (request, reply) => {
        // In a real implementation, this would serve files from rootPath
        reply.code(501).send({ error: 'Static file serving not implemented in this demo' });
      });
    });
  },

  /**
   * Compression plugin
   */
  compress: (options?: { threshold?: number }) => {
    return PluginFactory.simple('compress', async (instance, opts) => {
      instance.addHook('onSend', async (request, reply) => {
        const acceptEncoding = request.headers['accept-encoding'] as string;

        if (acceptEncoding?.includes('gzip')) {
          // In a real implementation, this would compress the response
          reply.header('Content-Encoding', 'gzip');
        }
      });
    });
  },

  /**
   * Cookie parser plugin
   */
  cookie: () => {
    return PluginFactory.simple('cookie', async (instance, opts) => {
      instance.decorateRequest('cookies', {});

      instance.addHook('onRequest', async (request, reply) => {
        const cookieHeader = request.headers.cookie as string;
        if (cookieHeader) {
          const cookies: Record<string, string> = {};
          cookieHeader.split(';').forEach(cookie => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) {
              cookies[key] = decodeURIComponent(value);
            }
          });
          (request as any).cookies = cookies;
        }
      });

      instance.decorateReply('setCookie', function (name: string, value: string, options?: any) {
        let cookie = `${name}=${encodeURIComponent(value)}`;
        if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
        if (options?.path) cookie += `; Path=${options.path}`;
        if (options?.domain) cookie += `; Domain=${options.domain}`;
        if (options?.secure) cookie += '; Secure';
        if (options?.httpOnly) cookie += '; HttpOnly';
        if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;

        this.header('Set-Cookie', cookie);
        return this;
      });
    });
  },

  /**
   * Multipart/form-data plugin
   */
  multipart: () => {
    return PluginFactory.simple('multipart', async (instance, opts) => {
      // In a real implementation, this would parse multipart data
      instance.addHook('preHandler', async (request, reply) => {
        const contentType = request.headers['content-type'] as string;
        if (contentType?.includes('multipart/form-data')) {
          // Parse multipart data
          (request as any).files = {};
        }
      });
    });
  },

  /**
   * Swagger/OpenAPI documentation plugin
   */
  swagger: (options?: {
    info?: {
      title?: string;
      description?: string;
      version?: string;
    };
  }) => {
    return PluginFactory.simple('swagger', async (instance, opts) => {
      const config = { ...options, ...opts };

      instance.get('/documentation/json', async (request, reply) => {
        reply.send({
          openapi: '3.0.0',
          info: config.info || {
            title: 'API Documentation',
            version: '1.0.0',
          },
          paths: {},
        });
      });

      instance.get('/documentation', async (request, reply) => {
        reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>API Documentation</title>
            </head>
            <body>
              <h1>API Documentation</h1>
              <p>Swagger UI would be rendered here</p>
            </body>
          </html>
        `);
      });
    });
  },

  /**
   * Health check plugin
   */
  healthCheck: (options?: {
    path?: string;
    checker?: () => Promise<boolean> | boolean;
  }) => {
    return PluginFactory.simple('health-check', async (instance, opts) => {
      const path = options?.path || opts.path || '/health';
      const checker = options?.checker || opts.checker;

      instance.get(path, async (request, reply) => {
        if (checker) {
          try {
            const healthy = await checker();
            if (healthy) {
              reply.send({ status: 'ok', timestamp: new Date().toISOString() });
            } else {
              reply.code(503).send({ status: 'unhealthy', timestamp: new Date().toISOString() });
            }
          } catch (error) {
            reply.code(503).send({ status: 'error', error: (error as Error).message });
          }
        } else {
          reply.send({ status: 'ok', timestamp: new Date().toISOString() });
        }
      });
    });
  },
};

/**
 * Polyglot plugin helpers
 * Create plugins using Python or Ruby code
 */
export class PolyglotPlugins {
  /**
   * Create a plugin from Python code
   *
   * Example:
   * ```typescript
   * const plugin = PolyglotPlugins.fromPython('my-plugin', `
   * def register(app, opts):
   *     @app.get('/python-route')
   *     def handler(request, reply):
   *         reply.send({'message': 'Hello from Python!'})
   * `);
   * ```
   */
  static fromPython(name: string, code: string): PluginFunction {
    return PluginFactory.simple(name, async (instance, opts) => {
      // In production Elide runtime with polyglot support:
      /*
      const pythonPlugin = Polyglot.eval('python', code);
      await pythonPlugin.register(instance, opts);
      */

      console.log(`[Polyglot Plugin] Would load Python plugin '${name}':`, code);
    });
  }

  /**
   * Create a plugin from Ruby code
   */
  static fromRuby(name: string, code: string): PluginFunction {
    return PluginFactory.simple(name, async (instance, opts) => {
      // In production: Polyglot.eval('ruby', code)
      console.log(`[Polyglot Plugin] Would load Ruby plugin '${name}':`, code);
    });
  }

  /**
   * Import plugin from Python file
   */
  static importPython(filepath: string): PluginFunction {
    const name = filepath.split('/').pop()?.replace('.py', '') || 'python-plugin';
    return PluginFactory.simple(name, async (instance, opts) => {
      console.log(`[Polyglot Plugin] Would import Python plugin from: ${filepath}`);
    });
  }

  /**
   * Import plugin from Ruby file
   */
  static importRuby(filepath: string): PluginFunction {
    const name = filepath.split('/').pop()?.replace('.rb', '') || 'ruby-plugin';
    return PluginFactory.simple(name, async (instance, opts) => {
      console.log(`[Polyglot Plugin] Would import Ruby plugin from: ${filepath}`);
    });
  }
}
