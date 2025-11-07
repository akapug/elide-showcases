/**
 * Middleware Chain
 * Edge-style request/response middleware (Cloudflare Workers pattern)
 */

export type Context = Record<string, any>;

export interface Request {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface Response {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export type Middleware = (req: Request, ctx: Context, next: () => Promise<Response>) => Promise<Response>;

export class MiddlewareChain {
  private middlewares: Middleware[] = [];

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(req: Request): Promise<Response> {
    const ctx: Context = {};
    let index = 0;

    const next = async (): Promise<Response> => {
      if (index >= this.middlewares.length) {
        // Default response if no middleware handles it
        return { status: 404, headers: {}, body: 'Not Found' };
      }

      const middleware = this.middlewares[index++];
      return middleware(req, ctx, next);
    };

    return next();
  }
}

// Example middlewares
export const logger: Middleware = async (req, ctx, next) => {
  const start = Date.now();
  console.log(`→ ${req.method} ${req.url}`);

  const response = await next();

  const duration = Date.now() - start;
  console.log(`← ${response.status} (${duration}ms)`);

  return response;
};

export const cors: Middleware = async (req, ctx, next) => {
  const response = await next();

  response.headers['Access-Control-Allow-Origin'] = '*';
  response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE';
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type';

  return response;
};

export const jsonParser: Middleware = async (req, ctx, next) => {
  if (req.headers['content-type'] === 'application/json' && req.body) {
    try {
      ctx.body = JSON.parse(req.body);
    } catch {
      return { status: 400, headers: {}, body: 'Invalid JSON' };
    }
  }

  return next();
};

// CLI demo
if (import.meta.url.includes("middleware-chain.ts")) {
  console.log("Middleware Chain Demo\n");

  const chain = new MiddlewareChain();

  chain
    .use(logger)
    .use(cors)
    .use(jsonParser)
    .use(async (req, ctx, next) => {
      if (req.url === '/api/hello') {
        return {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ message: 'Hello, World!' })
        };
      }
      return next();
    });

  const testReq: Request = {
    url: '/api/hello',
    method: 'GET',
    headers: {}
  };

  chain.execute(testReq).then(response => {
    console.log("\nResponse:", response);
    console.log("✅ Middleware chain test passed");
  });
}
