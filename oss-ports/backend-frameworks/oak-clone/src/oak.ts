/**
 * Oak Clone - Middleware framework (Deno-style) for Elide
 *
 * Deno-inspired middleware framework with modern TypeScript patterns
 */

import { serve } from 'node:http';

export class Context<S extends State = Record<string, any>> {
  app: Application<S>;
  request: Request;
  response: Response;
  state: S;

  constructor(app: Application<S>, req: any, res: any) {
    this.app = app;
    this.request = new Request(req);
    this.response = new Response(res);
    this.state = {} as S;
  }

  assert(condition: any, status: number, message?: string): asserts condition {
    if (!condition) {
      throw createHttpError(status, message);
    }
  }

  throw(status: number, message?: string): never {
    throw createHttpError(status, message);
  }
}

export class Request {
  method: string;
  url: URL;
  headers: Headers;
  private rawReq: any;
  private _body?: any;

  constructor(req: any) {
    this.rawReq = req;
    this.method = req.method || 'GET';
    this.url = new URL(req.url || '/', 'http://localhost');
    this.headers = new Headers(req.headers || {});
  }

  async body(): Promise<Body> {
    if (this._body) return this._body;

    const contentType = this.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const text = await this.text();
      this._body = { type: 'json', value: JSON.parse(text) };
    } else {
      this._body = { type: 'text', value: await this.text() };
    }

    return this._body;
  }

  private async text(): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      this.rawReq.on('data', (chunk: any) => data += chunk.toString());
      this.rawReq.on('end', () => resolve(data));
      this.rawReq.on('error', reject);
    });
  }
}

export class Response {
  status?: number;
  body?: any;
  headers: Headers = new Headers();
  private rawRes: any;

  constructor(res: any) {
    this.rawRes = res;
  }

  redirect(url: string | URL): void {
    this.status = 302;
    this.headers.set('Location', url.toString());
  }
}

export class Router<S extends State = Record<string, any>> {
  private routes: Array<{
    method: string;
    path: RegExp;
    keys: string[];
    middleware: Middleware<S>[];
  }> = [];

  get(path: string, ...middleware: Middleware<S>[]): this {
    return this.register('GET', path, ...middleware);
  }

  post(path: string, ...middleware: Middleware<S>[]): this {
    return this.register('POST', path, ...middleware);
  }

  put(path: string, ...middleware: Middleware<S>[]): this {
    return this.register('PUT', path, ...middleware);
  }

  delete(path: string, ...middleware: Middleware<S>[]): this {
    return this.register('DELETE', path, ...middleware);
  }

  private register(method: string, path: string, ...middleware: Middleware<S>[]): this {
    const { pattern, keys } = this.compile(path);
    this.routes.push({ method, path: pattern, keys, middleware });
    return this;
  }

  private compile(path: string): { pattern: RegExp; keys: string[] } {
    const keys: string[] = [];
    const pattern = path.replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    return { pattern: new RegExp(`^${pattern}$`), keys };
  }

  routes(): Middleware<S> {
    return async (ctx, next) => {
      for (const route of this.routes) {
        if (route.method !== ctx.request.method) continue;

        const match = ctx.request.url.pathname.match(route.path);
        if (match) {
          const params: Record<string, string> = {};
          route.keys.forEach((key, i) => {
            params[key] = match[i + 1];
          });

          (ctx as any).params = params;

          for (const mw of route.middleware) {
            await mw(ctx, next);
          }
          return;
        }
      }

      await next();
    };
  }

  allowedMethods(): Middleware<S> {
    return async (ctx, next) => {
      await next();

      if (ctx.response.status === 404) {
        const allowed = this.routes
          .filter(r => ctx.request.url.pathname.match(r.path))
          .map(r => r.method);

        if (allowed.length > 0) {
          ctx.response.status = 405;
          ctx.response.headers.set('Allow', allowed.join(', '));
        }
      }
    };
  }
}

export interface Middleware<S extends State = Record<string, any>> {
  (context: Context<S>, next: () => Promise<unknown>): Promise<unknown> | unknown;
}

export type State = Record<string, any>;

interface Body {
  type: string;
  value: any;
}

class Headers {
  private headers: Map<string, string>;

  constructor(init?: Record<string, string | string[] | undefined>) {
    this.headers = new Map();
    if (init) {
      for (const [key, value] of Object.entries(init)) {
        if (value) {
          this.set(key, Array.isArray(value) ? value[0] : value);
        }
      }
    }
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  entries(): IterableIterator<[string, string]> {
    return this.headers.entries();
  }
}

export class Application<S extends State = Record<string, any>> extends EventTarget {
  private middleware: Middleware<S>[] = [];
  state: S = {} as S;

  use(...middleware: Middleware<S>[]): this {
    this.middleware.push(...middleware);
    return this;
  }

  async listen(options: { port: number; hostname?: string }): Promise<void> {
    const { port, hostname = '0.0.0.0' } = options;

    serve({ port, hostname }, async (req, res) => {
      await this.handle(req, res);
    });

    console.log(`Oak server listening on http://${hostname}:${port}`);
  }

  private async handle(req: any, res: any): Promise<void> {
    const ctx = new Context(this, req, res);
    ctx.state = { ...this.state };

    try {
      await this.compose(this.middleware)(ctx);
      this.respond(ctx, res);
    } catch (err) {
      this.handleError(err as Error, ctx, res);
    }
  }

  private compose(middleware: Middleware<S>[]) {
    return async (context: Context<S>) => {
      let index = -1;

      const dispatch = async (i: number): Promise<void> => {
        if (i <= index) throw new Error('next() called multiple times');
        index = i;
        if (i === middleware.length) return;

        const fn = middleware[i];
        await fn(context, () => dispatch(i + 1));
      };

      await dispatch(0);
    };
  }

  private respond(ctx: Context<S>, res: any): void {
    const { response } = ctx;

    res.statusCode = response.status || 200;

    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    if (response.body === undefined || response.body === null) {
      res.end();
    } else if (typeof response.body === 'string') {
      if (!response.headers.get('content-type')) {
        res.setHeader('Content-Type', 'text/plain');
      }
      res.end(response.body);
    } else {
      if (!response.headers.get('content-type')) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(response.body));
    }
  }

  private handleError(err: Error, ctx: Context<S>, res: any): void {
    const status = (err as any).status || 500;
    const message = (err as any).expose ? err.message : 'Internal Server Error';

    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: message, status }));
  }
}

function createHttpError(status: number, message?: string): Error {
  const err: any = new Error(message || `HTTP Error ${status}`);
  err.status = status;
  err.expose = status < 500;
  return err;
}

export default Application;
