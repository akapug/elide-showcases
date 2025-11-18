/**
 * express-async-errors - Async error handling for Express
 * Based on https://www.npmjs.com/package/express-async-errors (~3M+ downloads/week)
 *
 * Features:
 * - Automatic async error handling
 * - No try-catch needed
 * - Works with async/await
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Cleaner async route handlers
 */

// Patch Express to handle async errors automatically
function patchExpress(app: any): void {
  const originalUse = app.use;
  const originalGet = app.get;
  const originalPost = app.post;
  const originalPut = app.put;
  const originalDelete = app.delete;
  const originalPatch = app.patch;

  const wrapHandler = (handler: Function) => {
    return function(this: any, ...args: any[]) {
      const result = handler.apply(this, args);

      // If it's a promise, catch any errors
      if (result && typeof result.catch === 'function') {
        const next = args[args.length - 1];
        result.catch((err: Error) => {
          if (typeof next === 'function') {
            next(err);
          }
        });
      }

      return result;
    };
  };

  app.use = function(...args: any[]) {
    const handlers = args.map((arg: any) =>
      typeof arg === 'function' ? wrapHandler(arg) : arg
    );
    return originalUse.apply(this, handlers);
  };

  app.get = function(...args: any[]) {
    const handlers = args.slice(1).map((h: any) => wrapHandler(h));
    return originalGet.apply(this, [args[0], ...handlers]);
  };

  app.post = function(...args: any[]) {
    const handlers = args.slice(1).map((h: any) => wrapHandler(h));
    return originalPost.apply(this, [args[0], ...handlers]);
  };

  app.put = function(...args: any[]) {
    const handlers = args.slice(1).map((h: any) => wrapHandler(h));
    return originalPut.apply(this, [args[0], ...handlers]);
  };

  app.delete = function(...args: any[]) {
    const handlers = args.slice(1).map((h: any) => wrapHandler(h));
    return originalDelete.apply(this, [args[0], ...handlers]);
  };

  app.patch = function(...args: any[]) {
    const handlers = args.slice(1).map((h: any) => wrapHandler(h));
    return originalPatch.apply(this, [args[0], ...handlers]);
  };
}

// Helper to wrap async route handlers manually
function asyncHandler(fn: Function) {
  return function(req: any, res: any, next: Function) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export { patchExpress, asyncHandler };
export default patchExpress;

// Self-test
if (import.meta.url.includes("elide-express-async-errors.ts")) {
  console.log("✅ express-async-errors - Async Error Handling (POLYGLOT!)\n");

  // Mock Express app
  const mockApp = {
    get: function(path: string, handler: Function) {
      console.log('Route registered:', 'GET', path);
    },
    post: function(path: string, handler: Function) {
      console.log('Route registered:', 'POST', path);
    },
    use: function(handler: Function) {
      console.log('Middleware registered');
    },
    put: () => {},
    delete: () => {},
    patch: () => {}
  };

  patchExpress(mockApp);

  // Test async handler wrapper
  const handler = asyncHandler(async (req: any, res: any) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return { success: true };
  });

  console.log('✓ Express patched for async errors');
  console.log('✓ Async handler wrapper created');

  console.log("\n🚀 ~3M+ downloads/week | Simplify async Express routes\n");
}
