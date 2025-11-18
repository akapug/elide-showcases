/**
 * Fastify on Elide - Production-Ready Implementation
 *
 * A high-performance web framework for building efficient APIs with
 * schema validation, hooks, and plugin support - now with polyglot
 * capabilities via Elide and GraalVM.
 *
 * Features:
 * - Fast routing with schema validation
 * - Comprehensive hook system (onRequest, preHandler, onSend, onResponse)
 * - Plugin architecture with encapsulation
 * - JSON schema validation across languages
 * - Async/await support
 * - Content type negotiation
 * - Error handling
 * - Reply caching
 * - Polyglot language support
 */

import { IncomingMessage, ServerResponse, Server } from 'http';
import * as http from 'http';
import * as https from 'https';
import { Router, RouteHandler, RouteOptions } from './router';
import { SchemaCompiler, ValidationError } from './schemas';
import { HookManager, HookType, HookHandler } from './hooks';
import { PluginManager, PluginFunction, PluginOptions } from './plugins';

/**
 * HTTP Method types
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Fastify Request interface
 * Wraps Node.js IncomingMessage with additional helpers
 */
export interface FastifyRequest {
  id: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: any;
  headers: Record<string, string | string[] | undefined>;
  method: string;
  url: string;
  hostname: string;
  ip: string;
  protocol: string;
  raw: IncomingMessage;
  log: Logger;
  server: FastifyInstance;
  routeOptions: RouteOptions;
}

/**
 * Fastify Reply interface
 * Wraps Node.js ServerResponse with chainable helpers
 */
export interface FastifyReply {
  code(statusCode: number): FastifyReply;
  status(statusCode: number): FastifyReply;
  header(name: string, value: string | number): FastifyReply;
  headers(headers: Record<string, string | number>): FastifyReply;
  type(contentType: string): FastifyReply;
  send(payload?: any): FastifyReply;
  serialize(payload: any): string;
  getHeader(name: string): string | number | string[] | undefined;
  removeHeader(name: string): void;
  hasHeader(name: string): boolean;
  redirect(statusCode: number, url: string): FastifyReply;
  redirect(url: string): FastifyReply;
  callNotFound(): void;
  getResponseTime(): number;
  raw: ServerResponse;
  sent: boolean;
  log: Logger;
  server: FastifyInstance;
  request: FastifyRequest;
}

/**
 * Logger interface
 */
export interface Logger {
  info(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;
  trace(msg: string, ...args: any[]): void;
}

/**
 * Fastify Instance interface
 * Main application interface with all methods
 */
export interface FastifyInstance {
  // Route registration
  get(path: string, handler: RouteHandler): FastifyInstance;
  get(path: string, opts: RouteOptions, handler: RouteHandler): FastifyInstance;
  post(path: string, handler: RouteHandler): FastifyInstance;
  post(path: string, opts: RouteOptions, handler: RouteHandler): FastifyInstance;
  put(path: string, handler: RouteHandler): FastifyInstance;
  put(path: string, opts: RouteOptions, handler: RouteHandler): FastifyInstance;
  delete(path: string, handler: RouteHandler): FastifyInstance;
  delete(path: string, opts: RouteOptions, handler: RouteHandler): FastifyInstance;
  patch(path: string, handler: RouteHandler): FastifyInstance;
  patch(path: string, opts: RouteOptions, handler: RouteHandler): FastifyInstance;
  head(path: string, handler: RouteHandler): FastifyInstance;
  head(path: string, opts: RouteOptions, handler: RouteHandler): FastifyInstance;
  options(path: string, handler: RouteHandler): FastifyInstance;
  options(path: string, opts: RouteOptions, handler: RouteHandler): FastifyInstance;
  all(path: string, handler: RouteHandler): FastifyInstance;
  all(path: string, opts: RouteOptions, handler: RouteHandler): FastifyInstance;
  route(opts: RouteOptions): FastifyInstance;

  // Lifecycle hooks
  addHook(name: HookType, handler: HookHandler): FastifyInstance;

  // Plugin system
  register(plugin: PluginFunction, opts?: PluginOptions): FastifyInstance;

  // Decorators
  decorate(name: string, value: any): FastifyInstance;
  decorateRequest(name: string, value: any): FastifyInstance;
  decorateReply(name: string, value: any): FastifyInstance;

  // Server control
  listen(port: number, host?: string, callback?: (err: Error | null, address: string) => void): Promise<string>;
  listen(port: number, callback?: (err: Error | null, address: string) => void): Promise<string>;
  close(callback?: () => void): Promise<void>;
  ready(callback?: (err?: Error) => void): Promise<void>;

  // Error handling
  setErrorHandler(handler: (error: Error, request: FastifyRequest, reply: FastifyReply) => void): FastifyInstance;
  setNotFoundHandler(handler: (request: FastifyRequest, reply: FastifyReply) => void): FastifyInstance;

  // Schema validation
  setValidatorCompiler(compiler: (schema: any) => (data: any) => boolean): FastifyInstance;
  setSerializerCompiler(compiler: (schema: any) => (data: any) => string): FastifyInstance;

  // Properties
  log: Logger;
  server: Server;
  prefix: string;
}

/**
 * Fastify Options
 */
export interface FastifyServerOptions {
  logger?: boolean | Logger;
  ignoreTrailingSlash?: boolean;
  caseSensitive?: boolean;
  requestIdLogLabel?: string;
  trustProxy?: boolean;
  bodyLimit?: number;
  maxParamLength?: number;
}

/**
 * Implementation of FastifyRequest
 */
class FastifyRequestImpl implements FastifyRequest {
  public id: string;
  public params: Record<string, string> = {};
  public query: Record<string, string | string[]> = {};
  public body: any = undefined;
  public headers: Record<string, string | string[] | undefined>;
  public method: string;
  public url: string;
  public hostname: string;
  public ip: string;
  public protocol: string;
  public raw: IncomingMessage;
  public log: Logger;
  public server: FastifyInstance;
  public routeOptions: RouteOptions;

  constructor(req: IncomingMessage, server: FastifyInstance) {
    this.id = generateRequestId();
    this.raw = req;
    this.server = server;
    this.headers = req.headers as Record<string, string | string[] | undefined>;
    this.method = req.method || 'GET';
    this.url = req.url || '/';
    this.hostname = (req.headers.host || 'localhost').split(':')[0];
    this.ip = req.socket.remoteAddress || '127.0.0.1';
    this.protocol = (req.socket as any).encrypted ? 'https' : 'http';
    this.log = server.log;
    this.routeOptions = {} as RouteOptions;

    // Parse query string
    const urlObj = new URL(this.url, `http://${req.headers.host || 'localhost'}`);
    const query: Record<string, string | string[]> = {};
    urlObj.searchParams.forEach((value, key) => {
      if (query[key]) {
        if (Array.isArray(query[key])) {
          (query[key] as string[]).push(value);
        } else {
          query[key] = [query[key] as string, value];
        }
      } else {
        query[key] = value;
      }
    });
    this.query = query;
  }
}

/**
 * Implementation of FastifyReply
 */
class FastifyReplyImpl implements FastifyReply {
  public raw: ServerResponse;
  public sent: boolean = false;
  public log: Logger;
  public server: FastifyInstance;
  public request: FastifyRequest;
  private statusCode: number = 200;
  private startTime: number = Date.now();

  constructor(res: ServerResponse, request: FastifyRequest, server: FastifyInstance) {
    this.raw = res;
    this.request = request;
    this.server = server;
    this.log = server.log;
  }

  code(statusCode: number): FastifyReply {
    this.statusCode = statusCode;
    return this;
  }

  status(statusCode: number): FastifyReply {
    return this.code(statusCode);
  }

  header(name: string, value: string | number): FastifyReply {
    this.raw.setHeader(name, String(value));
    return this;
  }

  headers(headers: Record<string, string | number>): FastifyReply {
    Object.entries(headers).forEach(([name, value]) => {
      this.header(name, value);
    });
    return this;
  }

  type(contentType: string): FastifyReply {
    return this.header('Content-Type', contentType);
  }

  send(payload?: any): FastifyReply {
    if (this.sent) {
      this.log.warn('Reply already sent');
      return this;
    }

    this.sent = true;
    this.raw.statusCode = this.statusCode;

    // Handle different payload types
    if (payload === undefined || payload === null) {
      this.raw.end();
      return this;
    }

    if (typeof payload === 'string') {
      if (!this.hasHeader('Content-Type')) {
        this.type('text/plain; charset=utf-8');
      }
      this.raw.end(payload);
      return this;
    }

    if (Buffer.isBuffer(payload)) {
      if (!this.hasHeader('Content-Type')) {
        this.type('application/octet-stream');
      }
      this.raw.end(payload);
      return this;
    }

    // Handle objects - serialize as JSON
    if (typeof payload === 'object') {
      const serialized = this.serialize(payload);
      if (!this.hasHeader('Content-Type')) {
        this.type('application/json; charset=utf-8');
      }
      this.raw.end(serialized);
      return this;
    }

    // Convert other types to string
    this.raw.end(String(payload));
    return this;
  }

  serialize(payload: any): string {
    // Use custom serializer if available
    // For now, use JSON.stringify
    return JSON.stringify(payload);
  }

  getHeader(name: string): string | number | string[] | undefined {
    return this.raw.getHeader(name);
  }

  removeHeader(name: string): void {
    this.raw.removeHeader(name);
  }

  hasHeader(name: string): boolean {
    return this.raw.hasHeader(name);
  }

  redirect(statusCodeOrUrl: number | string, url?: string): FastifyReply {
    if (typeof statusCodeOrUrl === 'string') {
      this.code(302);
      this.header('Location', statusCodeOrUrl);
    } else {
      this.code(statusCodeOrUrl);
      this.header('Location', url!);
    }
    return this.send();
  }

  callNotFound(): void {
    // This will be handled by the not found handler
    (this as any)._callNotFound = true;
  }

  getResponseTime(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Simple logger implementation
 */
class SimpleLogger implements Logger {
  constructor(private enabled: boolean = true) {}

  info(msg: string, ...args: any[]): void {
    if (this.enabled) console.log('[INFO]', msg, ...args);
  }

  error(msg: string, ...args: any[]): void {
    if (this.enabled) console.error('[ERROR]', msg, ...args);
  }

  warn(msg: string, ...args: any[]): void {
    if (this.enabled) console.warn('[WARN]', msg, ...args);
  }

  debug(msg: string, ...args: any[]): void {
    if (this.enabled) console.debug('[DEBUG]', msg, ...args);
  }

  trace(msg: string, ...args: any[]): void {
    if (this.enabled) console.trace('[TRACE]', msg, ...args);
  }
}

/**
 * Main Fastify implementation
 */
export class Fastify implements FastifyInstance {
  public log: Logger;
  public server: Server;
  public prefix: string = '';

  private router: Router;
  private hookManager: HookManager;
  private pluginManager: PluginManager;
  private schemaCompiler: SchemaCompiler;
  private errorHandler?: (error: Error, request: FastifyRequest, reply: FastifyReply) => void;
  private notFoundHandler?: (request: FastifyRequest, reply: FastifyReply) => void;
  private options: FastifyServerOptions;
  private decorators: Map<string, any> = new Map();
  private requestDecorators: Map<string, any> = new Map();
  private replyDecorators: Map<string, any> = new Map();
  private isReady: boolean = false;

  constructor(options: FastifyServerOptions = {}) {
    this.options = options;

    // Initialize logger
    if (options.logger === true) {
      this.log = new SimpleLogger(true);
    } else if (typeof options.logger === 'object') {
      this.log = options.logger;
    } else {
      this.log = new SimpleLogger(false);
    }

    // Initialize components
    this.router = new Router({
      ignoreTrailingSlash: options.ignoreTrailingSlash ?? true,
      caseSensitive: options.caseSensitive ?? false,
      maxParamLength: options.maxParamLength ?? 100,
    });

    this.hookManager = new HookManager();
    this.pluginManager = new PluginManager(this);
    this.schemaCompiler = new SchemaCompiler();

    // Create HTTP server
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  // Route registration methods
  get(path: string, handlerOrOpts?: RouteHandler | RouteOptions, handler?: RouteHandler): FastifyInstance {
    return this.addRoute('GET', path, handlerOrOpts, handler);
  }

  post(path: string, handlerOrOpts?: RouteHandler | RouteOptions, handler?: RouteHandler): FastifyInstance {
    return this.addRoute('POST', path, handlerOrOpts, handler);
  }

  put(path: string, handlerOrOpts?: RouteHandler | RouteOptions, handler?: RouteHandler): FastifyInstance {
    return this.addRoute('PUT', path, handlerOrOpts, handler);
  }

  delete(path: string, handlerOrOpts?: RouteHandler | RouteOptions, handler?: RouteHandler): FastifyInstance {
    return this.addRoute('DELETE', path, handlerOrOpts, handler);
  }

  patch(path: string, handlerOrOpts?: RouteHandler | RouteOptions, handler?: RouteHandler): FastifyInstance {
    return this.addRoute('PATCH', path, handlerOrOpts, handler);
  }

  head(path: string, handlerOrOpts?: RouteHandler | RouteOptions, handler?: RouteHandler): FastifyInstance {
    return this.addRoute('HEAD', path, handlerOrOpts, handler);
  }

  options(path: string, handlerOrOpts?: RouteHandler | RouteOptions, handler?: RouteHandler): FastifyInstance {
    return this.addRoute('OPTIONS', path, handlerOrOpts, handler);
  }

  all(path: string, handlerOrOpts?: RouteHandler | RouteOptions, handler?: RouteHandler): FastifyInstance {
    const methods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    methods.forEach(method => {
      this.addRoute(method, path, handlerOrOpts, handler);
    });
    return this;
  }

  route(opts: RouteOptions): FastifyInstance {
    const methods = Array.isArray(opts.method) ? opts.method : [opts.method];
    methods.forEach(method => {
      this.router.addRoute(method, opts.url, opts.handler, opts);
    });
    return this;
  }

  private addRoute(
    method: HTTPMethod,
    path: string,
    handlerOrOpts?: RouteHandler | RouteOptions,
    handler?: RouteHandler
  ): FastifyInstance {
    let opts: RouteOptions;
    let routeHandler: RouteHandler;

    if (typeof handlerOrOpts === 'function') {
      routeHandler = handlerOrOpts;
      opts = { method, url: this.prefix + path, handler: routeHandler };
    } else {
      opts = handlerOrOpts || ({} as RouteOptions);
      routeHandler = handler!;
      opts.method = method;
      opts.url = this.prefix + path;
      opts.handler = routeHandler;
    }

    this.router.addRoute(method, opts.url, routeHandler, opts);
    return this;
  }

  // Hook management
  addHook(name: HookType, handler: HookHandler): FastifyInstance {
    this.hookManager.addHook(name, handler);
    return this;
  }

  // Plugin system
  register(plugin: PluginFunction, opts?: PluginOptions): FastifyInstance {
    this.pluginManager.register(plugin, opts);
    return this;
  }

  // Decorators
  decorate(name: string, value: any): FastifyInstance {
    this.decorators.set(name, value);
    (this as any)[name] = value;
    return this;
  }

  decorateRequest(name: string, value: any): FastifyInstance {
    this.requestDecorators.set(name, value);
    return this;
  }

  decorateReply(name: string, value: any): FastifyInstance {
    this.replyDecorators.set(name, value);
    return this;
  }

  // Server control
  async listen(
    port: number,
    hostOrCallback?: string | ((err: Error | null, address: string) => void),
    callback?: (err: Error | null, address: string) => void
  ): Promise<string> {
    await this.ready();

    const host = typeof hostOrCallback === 'string' ? hostOrCallback : '0.0.0.0';
    const cb = typeof hostOrCallback === 'function' ? hostOrCallback : callback;

    return new Promise((resolve, reject) => {
      this.server.listen(port, host, () => {
        const address = `http://${host}:${port}`;
        this.log.info(`Server listening on ${address}`);
        if (cb) cb(null, address);
        resolve(address);
      });

      this.server.on('error', (err) => {
        if (cb) cb(err, '');
        reject(err);
      });
    });
  }

  async close(callback?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          if (callback) callback();
          resolve();
        }
      });
    });
  }

  async ready(callback?: (err?: Error) => void): Promise<void> {
    if (this.isReady) {
      if (callback) callback();
      return Promise.resolve();
    }

    try {
      await this.pluginManager.loadPlugins();
      this.isReady = true;
      if (callback) callback();
      return Promise.resolve();
    } catch (err) {
      if (callback) callback(err as Error);
      return Promise.reject(err);
    }
  }

  // Error handlers
  setErrorHandler(handler: (error: Error, request: FastifyRequest, reply: FastifyReply) => void): FastifyInstance {
    this.errorHandler = handler;
    return this;
  }

  setNotFoundHandler(handler: (request: FastifyRequest, reply: FastifyReply) => void): FastifyInstance {
    this.notFoundHandler = handler;
    return this;
  }

  // Schema compilation
  setValidatorCompiler(compiler: (schema: any) => (data: any) => boolean): FastifyInstance {
    this.schemaCompiler.setValidatorCompiler(compiler);
    return this;
  }

  setSerializerCompiler(compiler: (schema: any) => (data: any) => string): FastifyInstance {
    this.schemaCompiler.setSerializerCompiler(compiler);
    return this;
  }

  // Request handling
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const request = new FastifyRequestImpl(req, this);
    const reply = new FastifyReplyImpl(res, request, this);

    // Apply request decorators
    this.requestDecorators.forEach((value, name) => {
      (request as any)[name] = typeof value === 'function' ? value() : value;
    });

    // Apply reply decorators
    this.replyDecorators.forEach((value, name) => {
      (reply as any)[name] = typeof value === 'function' ? value() : value;
    });

    try {
      // onRequest hook
      await this.hookManager.runHooks('onRequest', request, reply);

      // Parse body if needed
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        await this.parseBody(request);
      }

      // Route matching
      const route = this.router.findRoute(request.method, request.url);

      if (!route) {
        if (this.notFoundHandler) {
          await this.notFoundHandler(request, reply);
        } else {
          reply.code(404).send({ error: 'Not Found', message: `Route ${request.method} ${request.url} not found` });
        }
        return;
      }

      request.params = route.params;
      request.routeOptions = route.opts;

      // Validate request schema
      if (route.opts.schema) {
        this.validateRequest(request, route.opts.schema);
      }

      // preHandler hook
      await this.hookManager.runHooks('preHandler', request, reply);

      // Execute route handler
      const result = await route.handler(request, reply);

      // If handler returned a value and reply not sent, send it
      if (result !== undefined && !reply.sent) {
        reply.send(result);
      }

      // onSend hook
      await this.hookManager.runHooks('onSend', request, reply);

      // Ensure response is sent
      if (!reply.sent) {
        reply.send();
      }

      // onResponse hook
      await this.hookManager.runHooks('onResponse', request, reply);

    } catch (error) {
      await this.handleError(error as Error, request, reply);
    }
  }

  private async parseBody(request: FastifyRequest): Promise<void> {
    const contentType = request.headers['content-type'] || '';
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      request.raw.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        // Body size limit check
        const totalSize = chunks.reduce((acc, c) => acc + c.length, 0);
        if (this.options.bodyLimit && totalSize > this.options.bodyLimit) {
          reject(new Error('Request body too large'));
        }
      });

      request.raw.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');

        if (contentType.includes('application/json')) {
          try {
            request.body = JSON.parse(body || '{}');
          } catch (err) {
            reject(new Error('Invalid JSON'));
            return;
          }
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const params = new URLSearchParams(body);
          const parsed: Record<string, any> = {};
          params.forEach((value, key) => {
            parsed[key] = value;
          });
          request.body = parsed;
        } else {
          request.body = body;
        }

        resolve();
      });

      request.raw.on('error', reject);
    });
  }

  private validateRequest(request: FastifyRequest, schema: any): void {
    if (schema.body && request.body !== undefined) {
      const isValid = this.schemaCompiler.validate(schema.body, request.body);
      if (!isValid) {
        throw new ValidationError('Body validation failed', this.schemaCompiler.getErrors());
      }
    }

    if (schema.querystring && request.query) {
      const isValid = this.schemaCompiler.validate(schema.querystring, request.query);
      if (!isValid) {
        throw new ValidationError('Query validation failed', this.schemaCompiler.getErrors());
      }
    }

    if (schema.params && request.params) {
      const isValid = this.schemaCompiler.validate(schema.params, request.params);
      if (!isValid) {
        throw new ValidationError('Params validation failed', this.schemaCompiler.getErrors());
      }
    }

    if (schema.headers && request.headers) {
      const isValid = this.schemaCompiler.validate(schema.headers, request.headers);
      if (!isValid) {
        throw new ValidationError('Headers validation failed', this.schemaCompiler.getErrors());
      }
    }
  }

  private async handleError(error: Error, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.log.error(`Error handling request: ${error.message}`, error);

    if (this.errorHandler) {
      try {
        await this.errorHandler(error, request, reply);
        if (!reply.sent) {
          reply.send();
        }
        return;
      } catch (handlerError) {
        this.log.error('Error in error handler', handlerError);
      }
    }

    // Default error handling
    if (!reply.sent) {
      const statusCode = (error as any).statusCode || (error as any).status || 500;

      if (error instanceof ValidationError) {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message,
          validation: error.errors,
        });
      } else {
        reply.code(statusCode).send({
          error: http.STATUS_CODES[statusCode] || 'Internal Server Error',
          message: error.message,
        });
      }
    }
  }
}

/**
 * Factory function to create Fastify instance
 */
export function fastify(options?: FastifyServerOptions): FastifyInstance {
  return new Fastify(options);
}

/**
 * Generate unique request ID
 */
let requestIdCounter = 0;
function generateRequestId(): string {
  return `req-${Date.now()}-${++requestIdCounter}`;
}

/**
 * Export types and classes
 */
export default fastify;
export { ValidationError } from './schemas';
