/**
 * Koa Compose - Compose Koa Middleware
 *
 * Compose Koa middleware functions into a single middleware.
 * **POLYGLOT SHOWCASE**: Koa-style composition for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/koa-compose (~1M+ downloads/week)
 *
 * Features:
 * - Koa-style middleware composition
 * - Async/await support
 * - Context passing
 * - Error handling
 * - Clean stack traces
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java use same Koa pattern
 * - ONE composition system for all languages
 * - Share middleware logic
 * - Consistent async handling
 *
 * Use cases:
 * - Koa middleware stacks
 * - Async pipeline processing
 * - Context-based request handling
 * - Middleware composition
 *
 * Package has ~1M+ downloads/week on npm - core Koa utility!
 */

export type Middleware<T = any> = (context: T, next: () => Promise<void>) => Promise<void> | void;

/**
 * Compose middleware into a single function
 */
export function compose<T = any>(middleware: Array<Middleware<T>>): Middleware<T> {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }

  for (const fn of middleware) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!');
    }
  }

  return function (context: T, next?: () => Promise<void>): Promise<void> {
    let index = -1;

    function dispatch(i: number): Promise<void> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }

      index = i;
      let fn: Middleware<T> | undefined = middleware[i];

      if (i === middleware.length) {
        fn = next;
      }

      if (!fn) {
        return Promise.resolve();
      }

      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}

export default compose;

// CLI Demo
if (import.meta.url.includes("elide-koa-compose.ts")) {
  console.log("🎭 Koa Compose - Middleware Composition (POLYGLOT!)\n");

  interface Context {
    request: { method: string; url: string };
    response: { status: number; body?: any };
    state: Record<string, any>;
  }

  // Example middleware
  const logger: Middleware<Context> = async (ctx, next) => {
    console.log(`  --> ${ctx.request.method} ${ctx.request.url}`);
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`  <-- ${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
  };

  const responseTime: Middleware<Context> = async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.body = ctx.response.body || {};
    ctx.response.body.responseTime = `${ms}ms`;
  };

  const auth: Middleware<Context> = async (ctx, next) => {
    console.log(`  [Auth] Checking credentials...`);
    // Simulate async auth check
    await new Promise(resolve => setTimeout(resolve, 50));
    ctx.state.user = { id: 1, name: 'Alice' };
    console.log(`  [Auth] User authenticated: ${ctx.state.user.name}`);
    await next();
  };

  const handler: Middleware<Context> = async (ctx, next) => {
    console.log(`  [Handler] Processing request...`);
    ctx.response.status = 200;
    ctx.response.body = {
      message: 'Hello!',
      user: ctx.state.user
    };
    await next();
  };

  // Example 1: Basic composition
  console.log("=== Example 1: Basic Composition ===");
  (async () => {
    const app = compose([logger, handler]);

    const ctx: Context = {
      request: { method: 'GET', url: '/api/hello' },
      response: { status: 404 },
      state: {}
    };

    await app(ctx);
    console.log(`  Response:`, ctx.response.body);
    console.log();

    // Example 2: With auth middleware
    console.log("=== Example 2: With Authentication ===");
    const secureApp = compose([logger, auth, handler]);

    const ctx2: Context = {
      request: { method: 'POST', url: '/api/users' },
      response: { status: 404 },
      state: {}
    };

    await secureApp(ctx2);
    console.log(`  Response:`, ctx2.response.body);
    console.log();

    // Example 3: Response time tracking
    console.log("=== Example 3: Response Time Tracking ===");
    const timedApp = compose([logger, responseTime, auth, handler]);

    const ctx3: Context = {
      request: { method: 'GET', url: '/api/data' },
      response: { status: 404 },
      state: {}
    };

    await timedApp(ctx3);
    console.log(`  Response:`, ctx3.response.body);
    console.log();

    // Example 4: Error handling
    console.log("=== Example 4: Error Handling ===");
    const errorHandler: Middleware<Context> = async (ctx, next) => {
      try {
        await next();
      } catch (err: any) {
        console.log(`  [Error] Caught: ${err.message}`);
        ctx.response.status = 500;
        ctx.response.body = { error: err.message };
      }
    };

    const throwError: Middleware<Context> = async (ctx, next) => {
      throw new Error('Something went wrong!');
    };

    const errorApp = compose([errorHandler, logger, throwError]);

    const ctx4: Context = {
      request: { method: 'GET', url: '/error' },
      response: { status: 404 },
      state: {}
    };

    await errorApp(ctx4);
    console.log(`  Response:`, ctx4.response.body);
    console.log();

    // Example 5: Conditional middleware
    console.log("=== Example 5: Conditional Middleware ===");
    const conditional: Middleware<Context> = async (ctx, next) => {
      console.log(`  [Conditional] Checking if admin route...`);
      if (ctx.request.url.startsWith('/admin')) {
        console.log(`  [Conditional] Admin route - checking permissions`);
        if (!ctx.state.user?.isAdmin) {
          ctx.response.status = 403;
          ctx.response.body = { error: 'Forbidden' };
          return;
        }
      }
      await next();
    };

    const adminApp = compose([logger, auth, conditional, handler]);

    const ctx5: Context = {
      request: { method: 'GET', url: '/admin/users' },
      response: { status: 404 },
      state: {}
    };

    await adminApp(ctx5);
    console.log(`  Response:`, ctx5.response.body);
    console.log();

    console.log("=== POLYGLOT Use Case ===");
    console.log("🌐 Same Koa composition works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log("\nBenefits:");
    console.log("  ✓ Koa-style async/await everywhere");
    console.log("  ✓ Clean middleware composition");
    console.log("  ✓ Context-based request handling");
    console.log("  ✓ ~1M+ downloads/week on npm!");
    console.log("\n✅ Use Cases:");
    console.log("- Koa web applications");
    console.log("- Async request pipelines");
    console.log("- Context-based middleware");
    console.log("- Clean error handling");
  })();
}
