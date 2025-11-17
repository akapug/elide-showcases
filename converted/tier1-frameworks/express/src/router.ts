/**
 * Express Router - Routing Implementation
 *
 * Handles routing logic including:
 * - Path matching with parameters
 * - HTTP method routing
 * - Middleware chains
 * - Route groups
 * - Parameter callbacks
 */

import { Request } from './request';
import { Response } from './response';
import { RequestHandler, ErrorRequestHandler, NextFunction, RouteHandler } from './application';

/**
 * Router options
 */
export interface RouterOptions {
  caseSensitive?: boolean;
  strict?: boolean;
  mergeParams?: boolean;
}

/**
 * Layer represents a single middleware/route in the stack
 */
class Layer {
  public path: string;
  public method?: string;
  public handle: RequestHandler | ErrorRequestHandler;
  public regexp: RegExp;
  public keys: string[] = [];
  public params?: any;

  constructor(path: string, options: RouterOptions, fn: RequestHandler | ErrorRequestHandler, method?: string) {
    this.path = path;
    this.method = method;
    this.handle = fn;
    this.regexp = this.pathToRegexp(path, this.keys, options);
  }

  /**
   * Convert path to regexp for matching
   * Supports path parameters like :id
   */
  private pathToRegexp(path: string, keys: string[], options: RouterOptions): RegExp {
    // Handle wildcard
    if (path === '*' || path === '/*') {
      return /.*/;
    }

    // Escape special regex characters except :param
    let regexpStr = path
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    // Extract parameter names and create capture groups
    regexpStr = regexpStr.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, paramName) => {
      keys.push(paramName);
      return '([^/]+)';
    });

    // Handle optional trailing slash based on strict setting
    if (!options.strict && !regexpStr.endsWith('\\*')) {
      regexpStr = regexpStr + '/?';
    }

    // Case sensitivity
    const flags = options.caseSensitive ? '' : 'i';

    return new RegExp('^' + regexpStr + '$', flags);
  }

  /**
   * Check if this layer matches the given path
   * Extracts parameters if matched
   */
  public match(path: string): boolean {
    const matches = this.regexp.exec(path);

    if (!matches) {
      return false;
    }

    // Extract parameters
    this.params = {};
    for (let i = 0; i < this.keys.length; i++) {
      this.params[this.keys[i]] = matches[i + 1];
    }

    return true;
  }

  /**
   * Check if this layer handles the given method
   */
  public matchMethod(method: string): boolean {
    if (!this.method) {
      return true; // Middleware matches all methods
    }
    return this.method.toUpperCase() === method.toUpperCase();
  }

  /**
   * Check if this is an error handling middleware (4 parameters)
   */
  public isErrorHandler(): boolean {
    return this.handle.length === 4;
  }
}

/**
 * Route class - represents a single route with multiple methods
 */
class Route {
  public path: string;
  private stack: Layer[] = [];
  private methods: Set<string> = new Set();

  constructor(path: string) {
    this.path = path;
  }

  /**
   * Add method handler to this route
   */
  private addMethod(method: string, handlers: RequestHandler[]): this {
    this.methods.add(method.toUpperCase());

    handlers.forEach(handler => {
      const layer = new Layer(this.path, {}, handler, method);
      this.stack.push(layer);
    });

    return this;
  }

  /**
   * Handle request for this route
   */
  public handle(req: Request, res: Response, done: NextFunction): void {
    let idx = 0;

    const next = (err?: any): void => {
      // If error, skip to done
      if (err) {
        return done(err);
      }

      // Get next layer
      if (idx >= this.stack.length) {
        return done();
      }

      const layer = this.stack[idx++];

      // Check if method matches
      if (!layer.matchMethod(req.method!)) {
        return next();
      }

      // Execute handler
      try {
        layer.handle(req, res, next);
      } catch (err) {
        next(err);
      }
    };

    next();
  }

  /**
   * Check if route handles the given method
   */
  public handlesMethod(method: string): boolean {
    if (this.methods.has('ALL')) {
      return true;
    }
    return this.methods.has(method.toUpperCase());
  }

  // HTTP method shortcuts
  public get(...handlers: RequestHandler[]): this {
    return this.addMethod('GET', handlers);
  }

  public post(...handlers: RequestHandler[]): this {
    return this.addMethod('POST', handlers);
  }

  public put(...handlers: RequestHandler[]): this {
    return this.addMethod('PUT', handlers);
  }

  public delete(...handlers: RequestHandler[]): this {
    return this.addMethod('DELETE', handlers);
  }

  public patch(...handlers: RequestHandler[]): this {
    return this.addMethod('PATCH', handlers);
  }

  public options(...handlers: RequestHandler[]): this {
    return this.addMethod('OPTIONS', handlers);
  }

  public head(...handlers: RequestHandler[]): this {
    return this.addMethod('HEAD', handlers);
  }

  public all(...handlers: RequestHandler[]): this {
    return this.addMethod('ALL', handlers);
  }
}

/**
 * Router class - main routing functionality
 */
export class Router {
  private stack: Layer[] = [];
  private options: RouterOptions;
  private params: Map<string, Array<(req: Request, res: Response, next: NextFunction, value: any, name: string) => void>> = new Map();

  constructor(options: RouterOptions = {}) {
    this.options = {
      caseSensitive: options.caseSensitive || false,
      strict: options.strict || false,
      mergeParams: options.mergeParams || false
    };
  }

  /**
   * Add middleware or route handler
   */
  public use(...args: any[]): this {
    let path = '/';
    let handlers: RequestHandler[] = [];

    // Parse arguments
    if (typeof args[0] === 'string') {
      path = args[0];
      handlers = args.slice(1);
    } else {
      handlers = args;
    }

    // Flatten handler arrays
    handlers = this.flattenHandlers(handlers);

    // Add each handler as a layer
    handlers.forEach(handler => {
      const layer = new Layer(path, this.options, handler);
      this.stack.push(layer);
    });

    return this;
  }

  /**
   * Create a route for the given path
   */
  public route(path: string): Route {
    const route = new Route(path);

    // Create a layer that uses this route
    const layer = new Layer(path, this.options, (req: Request, res: Response, next: NextFunction) => {
      route.handle(req, res, next);
    });

    // Store reference to route in layer
    (layer as any).route = route;

    this.stack.push(layer);

    return route;
  }

  /**
   * Flatten nested handler arrays
   */
  private flattenHandlers(handlers: any[]): RequestHandler[] {
    const result: RequestHandler[] = [];

    handlers.forEach(handler => {
      if (Array.isArray(handler)) {
        result.push(...this.flattenHandlers(handler));
      } else if (typeof handler === 'function') {
        result.push(handler);
      } else if (handler && typeof handler.handle === 'function') {
        // Sub-app or router
        result.push((req, res, next) => handler.handle(req, res, next));
      }
    });

    return result;
  }

  /**
   * Register parameter callback
   */
  public param(name: string, handler: (req: Request, res: Response, next: NextFunction, value: any, name: string) => void): this {
    if (!this.params.has(name)) {
      this.params.set(name, []);
    }
    this.params.get(name)!.push(handler);
    return this;
  }

  /**
   * Handle incoming request
   */
  public handle(req: Request, res: Response, done: NextFunction): void {
    let idx = 0;
    let paramIndex = 0;
    const self = this;

    const next = (err?: any): void => {
      // Get next layer
      if (idx >= self.stack.length) {
        return done(err);
      }

      const layer = self.stack[idx++];

      // Check if path matches
      const path = req.path || '/';
      if (!layer.match(path)) {
        return next(err);
      }

      // Merge params
      if (layer.params) {
        req.params = { ...req.params, ...layer.params };
      }

      // Process param callbacks if needed
      if (layer.params && Object.keys(layer.params).length > 0) {
        return self.processParams(layer, req, res, next, err);
      }

      // If error and this is not error handler, skip
      if (err && !layer.isErrorHandler()) {
        return next(err);
      }

      // If no error and this is error handler, skip
      if (!err && layer.isErrorHandler()) {
        return next();
      }

      // Check method for routes (not middleware)
      if (layer.method && !layer.matchMethod(req.method!)) {
        return next(err);
      }

      // Execute handler
      try {
        if (layer.isErrorHandler() && err) {
          (layer.handle as ErrorRequestHandler)(err, req, res, next);
        } else if (!layer.isErrorHandler() && !err) {
          (layer.handle as RequestHandler)(req, res, next);
        } else {
          next(err);
        }
      } catch (error) {
        next(error);
      }
    };

    next();
  }

  /**
   * Process parameter callbacks
   */
  private processParams(layer: Layer, req: Request, res: Response, done: NextFunction, err?: any): void {
    const params = layer.params || {};
    const keys = Object.keys(params);

    if (keys.length === 0) {
      return done(err);
    }

    let idx = 0;

    const next = (err?: any): void => {
      if (err) {
        return done(err);
      }

      if (idx >= keys.length) {
        return done();
      }

      const key = keys[idx++];
      const value = params[key];
      const callbacks = this.params.get(key) || [];

      let callbackIdx = 0;

      const nextCallback = (err?: any): void => {
        if (err) {
          return done(err);
        }

        if (callbackIdx >= callbacks.length) {
          return next();
        }

        const callback = callbacks[callbackIdx++];

        try {
          callback(req, res, nextCallback, value, key);
        } catch (error) {
          nextCallback(error);
        }
      };

      nextCallback();
    };

    next();
  }

  // HTTP method shortcuts
  public get(path: string, ...handlers: RouteHandler[]): this {
    const route = this.route(path);
    route.get(...this.flattenHandlers(handlers));
    return this;
  }

  public post(path: string, ...handlers: RouteHandler[]): this {
    const route = this.route(path);
    route.post(...this.flattenHandlers(handlers));
    return this;
  }

  public put(path: string, ...handlers: RouteHandler[]): this {
    const route = this.route(path);
    route.put(...this.flattenHandlers(handlers));
    return this;
  }

  public delete(path: string, ...handlers: RouteHandler[]): this {
    const route = this.route(path);
    route.delete(...this.flattenHandlers(handlers));
    return this;
  }

  public patch(path: string, ...handlers: RouteHandler[]): this {
    const route = this.route(path);
    route.patch(...this.flattenHandlers(handlers));
    return this;
  }

  public options(path: string, ...handlers: RouteHandler[]): this {
    const route = this.route(path);
    route.options(...this.flattenHandlers(handlers));
    return this;
  }

  public head(path: string, ...handlers: RouteHandler[]): this {
    const route = this.route(path);
    route.head(...this.flattenHandlers(handlers));
    return this;
  }

  public all(path: string, ...handlers: RouteHandler[]): this {
    const route = this.route(path);
    route.all(...this.flattenHandlers(handlers));
    return this;
  }
}

export default Router;
