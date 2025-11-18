/**
 * Koa - Expressive HTTP Middleware Framework
 *
 * Next generation web framework for Node.js, designed by the Express team.
 * **POLYGLOT SHOWCASE**: Modern async middleware for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/koa (~9M downloads/week)
 *
 * Features:
 * - Async/await middleware architecture
 * - Context object encapsulating req/res
 * - Cascade middleware composition
 * - Error handling with try/catch
 * - Minimal footprint (no bundled middleware)
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need modern web frameworks
 * - ONE async middleware pattern works everywhere on Elide
 * - Consistent error handling across languages
 * - Share middleware logic across your stack
 *
 * Use cases:
 * - Modern REST APIs
 * - Microservices architecture
 * - Backend-for-frontend (BFF) patterns
 * - GraphQL servers
 *
 * Package has ~9M downloads/week on npm - next-gen web framework!
 */

interface Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

interface Response {
  status: number;
  body?: any;
  headers: Record<string, string>;
  message?: string;
}

interface Context {
  req: Request;
  res: Response;
  request: Request;
  response: Response;
  state: Record<string, any>;
  throw(status: number, message?: string): never;
  assert(value: any, status: number, message?: string): void;
}

type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;

/**
 * Create Koa context object
 */
function createContext(req: Request): Context {
  const res: Response = {
    status: 404,
    headers: {},
  };

  const ctx: Context = {
    req,
    res,
    request: req,
    response: res,
    state: {},
    throw(status: number, message?: string): never {
      const error: any = new Error(message || `HTTP Error ${status}`);
      error.status = status;
      throw error;
    },
    assert(value: any, status: number, message?: string): void {
      if (!value) {
        this.throw(status, message);
      }
    },
  };

  return ctx;
}

/**
 * Compose middleware into a single function
 */
function compose(middleware: Middleware[]): (ctx: Context) => Promise<void> {
  return async function (ctx: Context) {
    let index = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      if (i >= middleware.length) {
        return;
      }

      const fn = middleware[i];
      await fn(ctx, () => dispatch(i + 1));
    }

    await dispatch(0);
  };
}

/**
 * Koa application
 */
export class Koa {
  private middleware: Middleware[] = [];
  public context: Partial<Context> = {};
  public env: string = 'development';

  /**
   * Register middleware
   */
  use(fn: Middleware): this {
    this.middleware.push(fn);
    return this;
  }

  /**
   * Handle request
   */
  async callback(req: Request): Promise<Response> {
    const ctx = createContext(req);

    // Merge app context
    Object.assign(ctx, this.context);

    const fn = compose(this.middleware);

    try {
      await fn(ctx);
    } catch (err: any) {
      ctx.res.status = err.status || 500;
      ctx.res.body = {
        error: err.message || 'Internal Server Error',
      };
    }

    // Default 404
    if (ctx.res.body === undefined && ctx.res.status === 404) {
      ctx.res.body = 'Not Found';
    }

    return ctx.res;
  }

  /**
   * Create HTTP handler
   */
  listen(port: number = 3000): void {
    console.log(`Koa server listening on port ${port}`);
  }
}

export default Koa;

// CLI Demo
if (import.meta.url.includes("elide-koa.ts")) {
  console.log("🎯 Koa - Next Generation Web Framework (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Koa App ===");
  const app = new Koa();

  app.use(async (ctx) => {
    ctx.res.status = 200;
    ctx.res.body = { message: "Hello Koa!" };
  });

  const req1: Request = {
    method: "GET",
    url: "/",
    headers: {},
  };

  app.callback(req1).then((res) => {
    console.log("Response:", res);
  });
  console.log();

  console.log("=== Example 2: Middleware Cascade ===");
  const app2 = new Koa();

  // Logger middleware
  app2.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`  ${ctx.req.method} ${ctx.req.url} - ${ms}ms`);
  });

  // Response middleware
  app2.use(async (ctx) => {
    ctx.res.status = 200;
    ctx.res.body = { data: "cascaded response" };
  });

  app2.callback(req1).then((res) => {
    console.log("Response:", res);
  });
  console.log();

  console.log("=== Example 3: Error Handling ===");
  const app3 = new Koa();

  app3.use(async (ctx) => {
    ctx.throw(401, "Unauthorized");
  });

  const req3: Request = {
    method: "GET",
    url: "/protected",
    headers: {},
  };

  app3.callback(req3).then((res) => {
    console.log("Error response:", res);
  });
  console.log();

  console.log("=== Example 4: Context State ===");
  const app4 = new Koa();

  app4.use(async (ctx, next) => {
    ctx.state.user = { id: 1, name: "Alice" };
    await next();
  });

  app4.use(async (ctx) => {
    ctx.res.status = 200;
    ctx.res.body = { user: ctx.state.user };
  });

  app4.callback(req1).then((res) => {
    console.log("Response with state:", res);
  });
  console.log();

  console.log("=== Example 5: Conditional Middleware ===");
  const app5 = new Koa();

  app5.use(async (ctx, next) => {
    if (ctx.req.url === "/api") {
      ctx.res.status = 200;
      ctx.res.body = { api: "v1" };
    } else {
      await next();
    }
  });

  app5.use(async (ctx) => {
    ctx.res.status = 200;
    ctx.res.body = { page: "home" };
  });

  const req5a: Request = { method: "GET", url: "/api", headers: {} };
  const req5b: Request = { method: "GET", url: "/", headers: {} };

  Promise.all([app5.callback(req5a), app5.callback(req5b)]).then(
    ([resA, resB]) => {
      console.log("API response:", resA);
      console.log("Home response:", resB);
    }
  );
  console.log();

  console.log("=== Example 6: Context Assertion ===");
  const app6 = new Koa();

  app6.use(async (ctx) => {
    const token = ctx.req.headers["authorization"];
    ctx.assert(token, 401, "Missing authorization header");
    ctx.res.status = 200;
    ctx.res.body = { authorized: true };
  });

  const req6: Request = { method: "GET", url: "/", headers: {} };

  app6.callback(req6).then((res) => {
    console.log("Assertion failed:", res);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Modern REST APIs with async/await");
  console.log("- Microservices with clean middleware");
  console.log("- GraphQL servers");
  console.log("- Backend-for-frontend patterns");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Minimal footprint");
  console.log("- ~9M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use same middleware pattern in Python/Ruby/Java");
  console.log("- Share error handling logic across languages");
  console.log("- One API design for all services");
}
