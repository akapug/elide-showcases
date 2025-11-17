/**
 * Express Application - Core Implementation
 *
 * Main application class implementing the Express.js API with full compatibility
 * and Elide's polyglot capabilities via GraalVM.
 *
 * Features:
 * - Complete Express 4.x API compatibility
 * - HTTP method routing (GET, POST, PUT, DELETE, PATCH, etc.)
 * - Middleware chain execution
 * - Route parameters and query strings
 * - Error handling middleware
 * - Static file serving
 * - Template engine support
 * - Polyglot language integration
 */

import { IncomingMessage, ServerResponse, Server } from 'http';
import { EventEmitter } from 'events';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';
import { Router } from './router';
import { Request } from './request';
import { Response } from './response';

/**
 * Middleware/Handler function types
 */
export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;
export type ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => void;
export type NextFunction = (err?: any) => void;

/**
 * Route handler type (can be single or array)
 */
export type RouteHandler = RequestHandler | RequestHandler[];

/**
 * Application settings type
 */
export interface AppSettings {
  [key: string]: any;
  env?: string;
  'trust proxy'?: boolean;
  'jsonp callback name'?: string;
  'json replacer'?: any;
  'json spaces'?: number;
  'case sensitive routing'?: boolean;
  'strict routing'?: boolean;
  'view cache'?: boolean;
  'view engine'?: string;
  views?: string;
  'x-powered-by'?: boolean;
  etag?: boolean | string | Function;
  'query parser'?: string | Function;
  'subdomain offset'?: number;
}

/**
 * Express Application Class
 *
 * The main Express application object with routing, middleware,
 * and HTTP server capabilities.
 */
export class Application extends EventEmitter {
  private settings: AppSettings = {};
  private engines: Map<string, Function> = new Map();
  private _router?: Router;
  private locals: any = {};
  private mountpath: string | string[] = '/';

  constructor() {
    super();
    this.defaultConfiguration();
  }

  /**
   * Initialize default configuration
   */
  private defaultConfiguration(): void {
    this.set('env', process.env.NODE_ENV || 'development');
    this.set('trust proxy', false);
    this.set('jsonp callback name', 'callback');
    this.set('json replacer', null);
    this.set('json spaces', this.get('env') === 'production' ? 0 : 2);
    this.set('case sensitive routing', false);
    this.set('strict routing', false);
    this.set('view cache', this.get('env') === 'production');
    this.set('views', path.join(process.cwd(), 'views'));
    this.set('x-powered-by', true);
    this.set('etag', 'weak');
    this.set('query parser', 'extended');
    this.set('subdomain offset', 2);
  }

  /**
   * Lazily create router instance
   */
  private lazyrouter(): void {
    if (!this._router) {
      this._router = new Router({
        caseSensitive: this.get('case sensitive routing'),
        strict: this.get('strict routing')
      });
    }
  }

  /**
   * Set application setting
   */
  public set(setting: string, value: any): this {
    this.settings[setting] = value;
    return this;
  }

  /**
   * Get application setting
   */
  public get(setting: string): any {
    return this.settings[setting];
  }

  /**
   * Check if setting is enabled (truthy)
   */
  public enabled(setting: string): boolean {
    return Boolean(this.get(setting));
  }

  /**
   * Check if setting is disabled (falsy)
   */
  public disabled(setting: string): boolean {
    return !this.get(setting);
  }

  /**
   * Enable setting (set to true)
   */
  public enable(setting: string): this {
    return this.set(setting, true);
  }

  /**
   * Disable setting (set to false)
   */
  public disable(setting: string): this {
    return this.set(setting, false);
  }

  /**
   * Register template engine
   */
  public engine(ext: string, fn: Function): this {
    // Add leading dot if not present
    const extension = ext[0] !== '.' ? '.' + ext : ext;
    this.engines.set(extension, fn);
    return this;
  }

  /**
   * Render view with data
   */
  public render(name: string, options: any, callback: (err: Error | null, html?: string) => void): void;
  public render(name: string, callback: (err: Error | null, html?: string) => void): void;
  public render(name: string, optionsOrCallback: any, callback?: (err: Error | null, html?: string) => void): void {
    const options = typeof optionsOrCallback === 'function' ? {} : optionsOrCallback;
    const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback!;

    // Merge app.locals and options
    const opts = { ...this.locals, ...options };

    // Get view engine
    const ext = path.extname(name) || '.' + this.get('view engine');
    const engine = this.engines.get(ext);

    if (!engine) {
      return cb(new Error(`No template engine registered for extension: ${ext}`));
    }

    // Get view path
    const viewsDir = this.get('views');
    const filepath = path.resolve(viewsDir, name);

    // Render template
    try {
      engine(filepath, opts, cb);
    } catch (err) {
      cb(err as Error);
    }
  }

  /**
   * Add middleware/route handler
   */
  public use(...args: any[]): this {
    this.lazyrouter();
    this._router!.use(...args);
    return this;
  }

  /**
   * Route HTTP GET requests
   */
  public get(path: string, ...handlers: RouteHandler[]): this;
  public get(setting: string): any;
  public get(pathOrSetting: string, ...handlers: RouteHandler[]): any {
    // If called with one arg, treat as settings getter
    if (handlers.length === 0) {
      return this.settings[pathOrSetting];
    }

    // Otherwise treat as route registration
    this.lazyrouter();
    this._router!.get(pathOrSetting, ...handlers);
    return this;
  }

  /**
   * Route HTTP POST requests
   */
  public post(path: string, ...handlers: RouteHandler[]): this {
    this.lazyrouter();
    this._router!.post(path, ...handlers);
    return this;
  }

  /**
   * Route HTTP PUT requests
   */
  public put(path: string, ...handlers: RouteHandler[]): this {
    this.lazyrouter();
    this._router!.put(path, ...handlers);
    return this;
  }

  /**
   * Route HTTP DELETE requests
   */
  public delete(path: string, ...handlers: RouteHandler[]): this {
    this.lazyrouter();
    this._router!.delete(path, ...handlers);
    return this;
  }

  /**
   * Route HTTP PATCH requests
   */
  public patch(path: string, ...handlers: RouteHandler[]): this {
    this.lazyrouter();
    this._router!.patch(path, ...handlers);
    return this;
  }

  /**
   * Route HTTP OPTIONS requests
   */
  public options(path: string, ...handlers: RouteHandler[]): this {
    this.lazyrouter();
    this._router!.options(path, ...handlers);
    return this;
  }

  /**
   * Route HTTP HEAD requests
   */
  public head(path: string, ...handlers: RouteHandler[]): this {
    this.lazyrouter();
    this._router!.head(path, ...handlers);
    return this;
  }

  /**
   * Route all HTTP methods
   */
  public all(path: string, ...handlers: RouteHandler[]): this {
    this.lazyrouter();
    this._router!.all(path, ...handlers);
    return this;
  }

  /**
   * Create a new route with path
   * Returns a route instance for chaining
   */
  public route(path: string): any {
    this.lazyrouter();
    return this._router!.route(path);
  }

  /**
   * Start HTTP server
   */
  public listen(port: number, callback?: () => void): Server;
  public listen(port: number, hostname: string, callback?: () => void): Server;
  public listen(port: number, hostnameOrCallback?: string | (() => void), callback?: () => void): Server {
    const server = http.createServer(this.handle.bind(this));

    if (typeof hostnameOrCallback === 'function') {
      return server.listen(port, hostnameOrCallback);
    } else if (typeof hostnameOrCallback === 'string') {
      return server.listen(port, hostnameOrCallback, callback);
    } else {
      return server.listen(port, callback);
    }
  }

  /**
   * Main request handler
   * This is the core function that handles all incoming HTTP requests
   */
  public handle(req: IncomingMessage, res: ServerResponse, done?: (err?: any) => void): void {
    // Create enhanced request/response objects
    const request = new Request(req, res, this);
    const response = new Response(req, res, this);

    // Set X-Powered-By header if enabled
    if (this.enabled('x-powered-by')) {
      response.setHeader('X-Powered-By', 'Express');
    }

    // Use router to handle request
    if (this._router) {
      this._router.handle(request, response, (err?: any) => {
        if (err) {
          this.handleError(err, request, response);
        } else if (done) {
          done();
        } else {
          // No route matched and no error - send 404
          this.handleNotFound(request, response);
        }
      });
    } else {
      // No router configured - send 404
      this.handleNotFound(request, response);
    }
  }

  /**
   * Handle 404 Not Found
   */
  private handleNotFound(req: Request, res: Response): void {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Cannot ${req.method} ${req.url}`);
  }

  /**
   * Handle errors
   */
  private handleError(err: any, req: Request, res: Response): void {
    // Emit error event for logging/monitoring
    this.emit('error', err, req, res);

    // If headers already sent, we can't send error response
    if (res.headersSent) {
      return;
    }

    // Set status code
    const status = err.status || err.statusCode || 500;
    res.statusCode = status;

    // In development, send full error details
    if (this.get('env') === 'development') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: {
          message: err.message,
          stack: err.stack,
          status
        }
      }, null, 2));
    } else {
      // In production, send minimal error info
      res.setHeader('Content-Type', 'text/plain');
      res.end(err.message || http.STATUS_CODES[status] || 'Internal Server Error');
    }
  }

  /**
   * Param callback registration
   */
  public param(name: string, handler: (req: Request, res: Response, next: NextFunction, value: any, name: string) => void): this;
  public param(name: string[], handler: (req: Request, res: Response, next: NextFunction, value: any, name: string) => void): this;
  public param(name: string | string[], handler: (req: Request, res: Response, next: NextFunction, value: any, name: string) => void): this {
    this.lazyrouter();

    if (Array.isArray(name)) {
      name.forEach(n => this._router!.param(n, handler));
    } else {
      this._router!.param(name, handler);
    }

    return this;
  }

  /**
   * Return router for mounting
   */
  public get router(): Router {
    this.lazyrouter();
    return this._router!;
  }
}

export default Application;
