/**
 * Polka Clone - Micro web server for Elide
 *
 * An extremely fast and tiny Express-compatible framework.
 * Minimal footprint with maximum performance.
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
  originalUrl: string;
  [key: string]: any;
}

export interface Response {
  statusCode: number;
  statusMessage: string;
  setHeader(name: string, value: string | number | string[]): void;
  getHeader(name: string): string | number | string[] | undefined;
  removeHeader(name: string): void;
  writeHead(statusCode: number, headers?: Record<string, string | number>): void;
  write(chunk: any): void;
  end(data?: any): void;
  send(data: any): void;
  json(data: any): void;
  status(code: number): Response;
  [key: string]: any;
}

export type Handler = (req: Request, res: Response, next?: () => void) => void | Promise<void>;

export interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

export interface PolkaOptions {
  onError?: (err: Error, req: Request, res: Response) => void;
  onNoMatch?: (req: Request, res: Response) => void;
}

// ==================== ROUTER ====================

class Router {
  routes: Route[] = [];

  add(method: string, pattern: string, handler: Handler): void {
    const { regex, keys } = this.parse(pattern);
    this.routes.push({
      method: method.toUpperCase(),
      pattern: regex,
      keys,
      handler
    });
  }

  find(method: string, path: string): { handler: Handler; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;

      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.keys.forEach((key, i) => {
          params[key] = match[i + 1];
        });
        return { handler: route.handler, params };
      }
    }
    return null;
  }

  private parse(pattern: string): { regex: RegExp; keys: string[] } {
    const keys: string[] = [];

    // Convert Express-style pattern to regex
    let regex = pattern
      .replace(/:([^/]+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    return {
      regex: new RegExp(`^${regex}$`),
      keys
    };
  }
}

// ==================== POLKA APPLICATION ====================

export class Polka {
  router: Router;
  middleware: Handler[] = [];
  server: any = null;
  onError?: (err: Error, req: Request, res: Response) => void;
  onNoMatch?: (req: Request, res: Response) => void;

  constructor(options: PolkaOptions = {}) {
    this.router = new Router();
    this.onError = options.onError;
    this.onNoMatch = options.onNoMatch;
  }

  // ==================== MIDDLEWARE ====================

  use(...args: any[]): this {
    if (typeof args[0] === 'function') {
      // use(handler)
      this.middleware.push(args[0]);
    } else if (typeof args[0] === 'string' && typeof args[1] === 'function') {
      // use(path, handler) - add path-specific middleware
      const path = args[0];
      const handler = args[1];
      this.middleware.push((req, res, next) => {
        if (req.path.startsWith(path)) {
          return handler(req, res, next);
        }
        next && next();
      });
    }
    return this;
  }

  // ==================== HTTP METHODS ====================

  get(pattern: string, handler: Handler): this {
    this.router.add('GET', pattern, handler);
    return this;
  }

  post(pattern: string, handler: Handler): this {
    this.router.add('POST', pattern, handler);
    return this;
  }

  put(pattern: string, handler: Handler): this {
    this.router.add('PUT', pattern, handler);
    return this;
  }

  delete(pattern: string, handler: Handler): this {
    this.router.add('DELETE', pattern, handler);
    return this;
  }

  patch(pattern: string, handler: Handler): this {
    this.router.add('PATCH', pattern, handler);
    return this;
  }

  head(pattern: string, handler: Handler): this {
    this.router.add('HEAD', pattern, handler);
    return this;
  }

  options(pattern: string, handler: Handler): this {
    this.router.add('OPTIONS', pattern, handler);
    return this;
  }

  all(pattern: string, handler: Handler): this {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    methods.forEach(method => {
      this.router.add(method, pattern, handler);
    });
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
    console.log(`Server listening on ${address}`);

    if (callback) {
      callback();
    }

    return this.server;
  }

  // ==================== REQUEST HANDLING ====================

  private async handle(rawReq: any, rawRes: any): Promise<void> {
    const req = this.createRequest(rawReq);
    const res = this.createResponse(rawRes, req);

    try {
      // Parse body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        await this.parseBody(rawReq, req);
      }

      // Run middleware
      await this.runMiddleware(req, res);

      // Find and execute route
      const match = this.router.find(req.method, req.path);

      if (match) {
        req.params = match.params;
        await match.handler(req, res);
      } else if (this.onNoMatch) {
        this.onNoMatch(req, res);
      } else {
        this.send404(res);
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
      headers: rawReq.headers || {},
      originalUrl: rawReq.url || '/'
    };

    // Copy raw request properties
    Object.assign(req, rawReq);

    return req;
  }

  private createResponse(rawRes: any, req: Request): Response {
    const res = rawRes as Response;

    // Add helper methods
    res.send = (data: any) => {
      if (typeof data === 'string') {
        if (!res.getHeader('content-type')) {
          res.setHeader('content-type', 'text/html');
        }
        res.end(data);
      } else if (Buffer.isBuffer(data)) {
        if (!res.getHeader('content-type')) {
          res.setHeader('content-type', 'application/octet-stream');
        }
        res.end(data);
      } else if (typeof data === 'object') {
        res.json(data);
      } else {
        res.end(String(data));
      }
    };

    res.json = (data: any) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(data));
    };

    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };

    return res;
  }

  private async runMiddleware(req: Request, res: Response): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middleware.length) return;

      const middleware = this.middleware[index++];
      await middleware(req, res, next);
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
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            req.body = this.parseFormData(data);
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

  private parseFormData(data: string): Record<string, string> {
    const result: Record<string, string> = {};
    const params = new URLSearchParams(data);

    for (const [key, value] of params) {
      result[key] = value;
    }

    return result;
  }

  private handleError(err: Error, req: Request, res: Response): void {
    console.error('Error:', err);

    if (this.onError) {
      this.onError(err, req, res);
    } else {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: err.message
      }));
    }
  }

  private send404(res: Response): void {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      error: 'Not Found',
      message: 'The requested resource was not found'
    }));
  }

  // ==================== HANDLER ====================

  handler(): (req: any, res: any) => Promise<void> {
    return async (req: any, res: any) => {
      await this.handle(req, res);
    };
  }
}

// ==================== FACTORY FUNCTION ====================

export default function polka(options?: PolkaOptions): Polka {
  return new Polka(options);
}

export { polka };
