/**
 * Restify Clone - REST API framework for Elide
 *
 * Specialized framework for building REST APIs with versioning,
 * content negotiation, throttling, and DTrace support.
 */

import { serve } from 'node:http';

// ==================== TYPES ====================

export interface Request {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  version?: string;
  route?: Route;
  [key: string]: any;
}

export interface Response {
  statusCode: number;
  send(code: number, body?: any): void;
  send(body: any): void;
  json(code: number, body: any): void;
  json(body: any): void;
  setHeader(name: string, value: string | number): void;
  header(name: string, value: string | number): void;
  writeHead(statusCode: number): void;
  end(data?: any): void;
  [key: string]: any;
}

export type Handler = (req: Request, res: Response, next: () => void) => void | Promise<void>;
export type ErrorHandler = (req: Request, res: Response, err: Error, next: () => void) => void;

export interface Route {
  method: string;
  path: string;
  version?: string | string[];
  handler: Handler;
  pattern: RegExp;
  keys: string[];
}

export interface RestifyOptions {
  name?: string;
  version?: string | string[];
  versions?: string[];
  formatters?: Record<string, (req: Request, res: Response, body: any) => string>;
  acceptable?: string[];
  strictRouting?: boolean;
  ignoreTrailingSlash?: boolean;
  handleUpgrades?: boolean;
  dtrace?: boolean;
  throttle?: ThrottleOptions;
}

export interface ThrottleOptions {
  burst?: number;
  rate?: number;
  ip?: boolean;
  username?: boolean;
}

// ==================== VERSIONING ====================

class VersionManager {
  parseVersion(req: Request): string | undefined {
    // Check Accept-Version header
    const acceptVersion = req.headers['accept-version'] as string;
    if (acceptVersion) {
      return acceptVersion.replace(/[^0-9.]/g, '');
    }

    // Check path-based versioning
    const match = req.path.match(/^\/v(\d+(?:\.\d+)?)/);
    if (match) {
      return match[1];
    }

    return undefined;
  }

  matchesVersion(requested: string | undefined, available: string | string[] | undefined): boolean {
    if (!available) return true;
    if (!requested) return false;

    const versions = Array.isArray(available) ? available : [available];

    return versions.some(v => {
      return requested.startsWith(v) || v.startsWith(requested);
    });
  }
}

// ==================== CONTENT NEGOTIATION ====================

class ContentNegotiator {
  private formatters: Record<string, (req: Request, res: Response, body: any) => string>;

  constructor(formatters?: Record<string, (req: Request, res: Response, body: any) => string>) {
    this.formatters = formatters || {
      'application/json': (req, res, body) => JSON.stringify(body),
      'text/plain': (req, res, body) => String(body),
      'text/html': (req, res, body) => `<html><body>${body}</body></html>`
    };
  }

  negotiate(req: Request): string {
    const accept = req.headers['accept'] as string || '*/*';

    for (const [type] of Object.entries(this.formatters)) {
      if (accept.includes(type) || accept.includes('*/*')) {
        return type;
      }
    }

    return 'application/json';
  }

  format(req: Request, res: Response, body: any): string {
    const contentType = this.negotiate(req);
    const formatter = this.formatters[contentType] || this.formatters['application/json'];

    res.setHeader('Content-Type', contentType);
    return formatter(req, res, body);
  }
}

// ==================== THROTTLING ====================

class Throttle {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private burst: number;
  private rate: number;
  private ip: boolean;

  constructor(options: ThrottleOptions = {}) {
    this.burst = options.burst || 100;
    this.rate = options.rate || 50; // requests per second
    this.ip = options.ip !== false;
  }

  check(req: Request): boolean {
    if (!this.ip) return true;

    const key = req.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();

    let entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + 1000 };
      this.requests.set(key, entry);
    }

    entry.count++;

    return entry.count <= this.burst;
  }
}

// ==================== ROUTER ====================

class Router {
  routes: Route[] = [];
  versionManager: VersionManager;

  constructor() {
    this.versionManager = new VersionManager();
  }

  add(method: string, path: string, version: string | string[] | undefined, handler: Handler): void {
    const { pattern, keys } = this.compile(path);

    this.routes.push({
      method: method.toUpperCase(),
      path,
      version,
      handler,
      pattern,
      keys
    });
  }

  find(req: Request): { route: Route; params: Record<string, string> } | null {
    const requestedVersion = this.versionManager.parseVersion(req);

    for (const route of this.routes) {
      if (route.method !== req.method.toUpperCase()) continue;

      if (!this.versionManager.matchesVersion(requestedVersion, route.version)) continue;

      const match = req.path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.keys.forEach((key, i) => {
          params[key] = match[i + 1];
        });
        return { route, params };
      }
    }

    return null;
  }

  private compile(path: string): { pattern: RegExp; keys: string[] } {
    const keys: string[] = [];

    const pattern = path
      .replace(/:([^/]+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    return {
      pattern: new RegExp(`^${pattern}$`),
      keys
    };
  }
}

// ==================== RESTIFY APPLICATION ====================

export class Restify {
  name: string;
  version: string | string[];
  router: Router;
  middleware: Handler[] = [];
  errorHandlers: ErrorHandler[] = [];
  contentNegotiator: ContentNegotiator;
  throttle?: Throttle;
  server: any = null;

  constructor(options: RestifyOptions = {}) {
    this.name = options.name || 'restify-clone';
    this.version = options.version || '1.0.0';
    this.router = new Router();
    this.contentNegotiator = new ContentNegotiator(options.formatters);

    if (options.throttle) {
      this.throttle = new Throttle(options.throttle);
    }
  }

  // ==================== MIDDLEWARE ====================

  use(...args: any[]): this {
    if (typeof args[0] === 'function') {
      this.middleware.push(args[0]);
    } else if (typeof args[0] === 'string' && typeof args[1] === 'function') {
      const path = args[0];
      const handler = args[1];
      this.middleware.push((req, res, next) => {
        if (req.path.startsWith(path)) {
          return handler(req, res, next);
        }
        next();
      });
    }
    return this;
  }

  pre(handler: Handler): this {
    this.middleware.unshift(handler);
    return this;
  }

  // ==================== HTTP METHODS ====================

  get(path: string, ...handlers: Handler[]): this;
  get(options: { path: string; version?: string | string[] }, ...handlers: Handler[]): this;
  get(...args: any[]): this {
    return this.addRoute('GET', args);
  }

  post(path: string, ...handlers: Handler[]): this;
  post(options: { path: string; version?: string | string[] }, ...handlers: Handler[]): this;
  post(...args: any[]): this {
    return this.addRoute('POST', args);
  }

  put(path: string, ...handlers: Handler[]): this;
  put(options: { path: string; version?: string | string[] }, ...handlers: Handler[]): this;
  put(...args: any[]): this {
    return this.addRoute('PUT', args);
  }

  del(path: string, ...handlers: Handler[]): this;
  del(options: { path: string; version?: string | string[] }, ...handlers: Handler[]): this;
  del(...args: any[]): this {
    return this.addRoute('DELETE', args);
  }

  patch(path: string, ...handlers: Handler[]): this;
  patch(options: { path: string; version?: string | string[] }, ...handlers: Handler[]): this;
  patch(...args: any[]): this {
    return this.addRoute('PATCH', args);
  }

  head(path: string, ...handlers: Handler[]): this;
  head(options: { path: string; version?: string | string[] }, ...handlers: Handler[]): this;
  head(...args: any[]): this {
    return this.addRoute('HEAD', args);
  }

  opts(path: string, ...handlers: Handler[]): this;
  opts(options: { path: string; version?: string | string[] }, ...handlers: Handler[]): this;
  opts(...args: any[]): this {
    return this.addRoute('OPTIONS', args);
  }

  private addRoute(method: string, args: any[]): this {
    let path: string;
    let version: string | string[] | undefined;
    let handlers: Handler[];

    if (typeof args[0] === 'string') {
      path = args[0];
      version = undefined;
      handlers = args.slice(1);
    } else {
      path = args[0].path;
      version = args[0].version;
      handlers = args.slice(1);
    }

    // Combine all handlers
    const handler: Handler = async (req, res, next) => {
      let index = 0;

      const runNext = async () => {
        if (index >= handlers.length) {
          next();
          return;
        }

        const h = handlers[index++];
        await h(req, res, runNext);
      };

      await runNext();
    };

    this.router.add(method, path, version, handler);
    return this;
  }

  // ==================== ERROR HANDLING ====================

  on(event: string, handler: any): this {
    if (event === 'error' || event === 'restifyError') {
      this.errorHandlers.push(handler);
    }
    return this;
  }

  // ==================== SERVER ====================

  listen(port: number, host: string = '0.0.0.0', callback?: () => void): any {
    this.server = serve(
      { port, hostname: host },
      async (req: any, res: any) => {
        await this.handle(req, res);
      }
    );

    const address = `http://${host}:${port}`;
    console.log(`${this.name} listening on ${address}`);

    if (callback) {
      callback();
    }

    return this.server;
  }

  close(callback?: () => void): void {
    if (this.server) {
      this.server.close();
    }
    if (callback) callback();
  }

  // ==================== REQUEST HANDLING ====================

  private async handle(rawReq: any, rawRes: any): Promise<void> {
    const req = this.createRequest(rawReq);
    const res = this.createResponse(rawRes, req);

    try {
      // Throttling check
      if (this.throttle && !this.throttle.check(req)) {
        res.send(429, { error: 'TooManyRequests', message: 'Rate limit exceeded' });
        return;
      }

      // Parse body
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        await this.parseBody(rawReq, req);
      }

      // Run middleware
      await this.runMiddleware(req, res);

      // Find and execute route
      const match = this.router.find(req);

      if (match) {
        req.params = match.params;
        req.route = match.route;

        await match.route.handler(req, res, () => {});
      } else {
        res.send(404, { error: 'NotFound', message: `${req.method} ${req.path} does not exist` });
      }
    } catch (err) {
      this.handleError(err as Error, req, res);
    }
  }

  private createRequest(rawReq: any): Request {
    const url = new URL(rawReq.url || '/', 'http://localhost');

    const req: Request = {
      method: rawReq.method || 'GET',
      url: rawReq.url || '/',
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      params: {},
      headers: rawReq.headers || {}
    };

    return req;
  }

  private createResponse(rawRes: any, req: Request): Response {
    const res: Response = rawRes as Response;

    res.send = (codeOrBody: number | any, body?: any) => {
      if (typeof codeOrBody === 'number') {
        res.statusCode = codeOrBody;
        if (body !== undefined) {
          const formatted = this.contentNegotiator.format(req, res, body);
          res.end(formatted);
        } else {
          res.end();
        }
      } else {
        const formatted = this.contentNegotiator.format(req, res, codeOrBody);
        res.end(formatted);
      }
    };

    res.json = (codeOrBody: number | any, body?: any) => {
      if (typeof codeOrBody === 'number') {
        res.statusCode = codeOrBody;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(codeOrBody));
      }
    };

    res.header = res.setHeader;

    return res;
  }

  private async runMiddleware(req: Request, res: Response): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middleware.length) return;

      const handler = this.middleware[index++];
      await handler(req, res, next);
    };

    await next();
  }

  private async parseBody(rawReq: any, req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
      let data = '';

      rawReq.on('data', (chunk: any) => {
        data += chunk.toString();
      });

      rawReq.on('end', () => {
        try {
          const contentType = req.headers['content-type'] as string || '';

          if (contentType.includes('application/json')) {
            req.body = data ? JSON.parse(data) : {};
          } else {
            req.body = data;
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      rawReq.on('error', reject);
    });
  }

  private handleError(err: Error, req: Request, res: Response): void {
    console.error('Error:', err);

    if (this.errorHandlers.length > 0) {
      for (const handler of this.errorHandlers) {
        handler(req, res, err, () => {});
      }
    } else {
      res.send(500, {
        error: 'InternalServerError',
        message: err.message
      });
    }
  }
}

// ==================== FACTORY FUNCTION ====================

export function createServer(options?: RestifyOptions): Restify {
  return new Restify(options);
}

export default createServer;
