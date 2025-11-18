/**
 * Composable Middleware - Compose Middleware Functions
 *
 * Compose multiple middleware functions into a single middleware.
 * **POLYGLOT SHOWCASE**: Function composition for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/composable-middleware (~50K+ downloads/week)
 *
 * Features:
 * - Compose middleware arrays
 * - Preserve middleware order
 * - Error propagation
 * - Async support
 * - Type-safe composition
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java use same composition pattern
 * - ONE composition library for all languages
 * - Share middleware chains
 * - Consistent execution order
 *
 * Use cases:
 * - Middleware composition
 * - Request pipeline building
 * - Reusable middleware groups
 * - Authentication + authorization chains
 *
 * Package has ~50K+ downloads/week on npm!
 */

export type Middleware = (
  req: any,
  res: any,
  next: (err?: any) => void
) => void | Promise<void>;

/**
 * Compose an array of middleware into a single middleware
 */
export function compose(...middleware: Middleware[]): Middleware {
  // Flatten array in case nested arrays passed
  const fns = middleware.flat();

  return function composedMiddleware(req: any, res: any, next: (err?: any) => void): void {
    let index = -1;

    function dispatch(i: number, err?: any): void {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      // If error, skip to end
      if (err) {
        next(err);
        return;
      }

      // No more middleware
      if (i >= fns.length) {
        next();
        return;
      }

      const fn = fns[i];

      try {
        const result = fn(req, res, (err?: any) => dispatch(i + 1, err));

        // Handle promises
        if (result && typeof result === 'object' && 'then' in result) {
          (result as Promise<void>).catch(next);
        }
      } catch (error) {
        next(error);
      }
    }

    dispatch(0);
  };
}

/**
 * Compose middleware with error handling
 */
export function composeWithError(...middleware: Middleware[]): Middleware {
  const composed = compose(...middleware);

  return function (req: any, res: any, next: (err?: any) => void): void {
    composed(req, res, (err?: any) => {
      if (err) {
        console.error('Middleware error:', err);
      }
      next(err);
    });
  };
}

export default compose;

// CLI Demo
if (import.meta.url.includes("elide-composable-middleware.ts")) {
  console.log("🔗 Composable Middleware - Function Composition (POLYGLOT!)\n");

  // Example middleware functions
  const logger: Middleware = (req, res, next) => {
    console.log(`  [Logger] ${req.method} ${req.url}`);
    next();
  };

  const timer: Middleware = (req, res, next) => {
    const start = Date.now();
    req.startTime = start;
    next();
    const duration = Date.now() - start;
    console.log(`  [Timer] Request took ${duration}ms`);
  };

  const auth: Middleware = (req, res, next) => {
    console.log(`  [Auth] Checking authentication...`);
    if (req.headers?.authorization) {
      req.user = { id: 1, name: 'Alice' };
      console.log(`  [Auth] User authenticated: ${req.user.name}`);
      next();
    } else {
      console.log(`  [Auth] No authorization header`);
      next(new Error('Unauthorized'));
    }
  };

  const acl: Middleware = (req, res, next) => {
    console.log(`  [ACL] Checking permissions...`);
    if (req.user?.name === 'Alice') {
      console.log(`  [ACL] Permission granted`);
      next();
    } else {
      next(new Error('Forbidden'));
    }
  };

  const handler: Middleware = (req, res, next) => {
    console.log(`  [Handler] Processing request`);
    res.body = { message: 'Success!', user: req.user };
    console.log(`  [Handler] Response:`, res.body);
    next();
  };

  // Example 1: Compose middleware
  console.log("=== Example 1: Basic Composition ===");
  const app1 = compose(logger, timer, handler);

  const req1 = { method: 'GET', url: '/api/data', headers: {} };
  const res1 = { statusCode: 200 };

  app1(req1, res1, (err) => {
    if (err) console.log(`  [Error] ${err.message}`);
    console.log();
  });

  // Example 2: Auth chain
  console.log("=== Example 2: Auth + ACL Chain ===");
  const authChain = compose(logger, auth, acl, handler);

  const req2 = {
    method: 'POST',
    url: '/api/admin',
    headers: { authorization: 'Bearer token123' }
  };
  const res2 = { statusCode: 200 };

  authChain(req2, res2, (err) => {
    if (err) console.log(`  [Error] ${err.message}`);
    console.log();
  });

  // Example 3: Failed auth
  console.log("=== Example 3: Failed Authentication ===");
  const req3 = { method: 'POST', url: '/api/admin', headers: {} };
  const res3 = { statusCode: 200 };

  authChain(req3, res3, (err) => {
    if (err) console.log(`  [Error] ${err.message}`);
    console.log();
  });

  // Example 4: Async middleware
  console.log("=== Example 4: Async Middleware ===");
  const asyncDb: Middleware = async (req, res, next) => {
    console.log(`  [DB] Fetching data...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    req.data = { items: [1, 2, 3] };
    console.log(`  [DB] Data fetched:`, req.data);
    next();
  };

  const asyncApp = compose(logger, asyncDb, handler);
  const req4 = { method: 'GET', url: '/api/items', headers: {} };
  const res4 = { statusCode: 200 };

  asyncApp(req4, res4, (err) => {
    if (err) console.log(`  [Error] ${err.message}`);
    console.log();
  });

  // Example 5: Reusable groups
  console.log("=== Example 5: Reusable Middleware Groups ===");
  const baseMiddleware = compose(logger, timer);
  const secureMiddleware = compose(baseMiddleware, auth, acl);
  const publicMiddleware = compose(baseMiddleware);

  console.log("Public endpoint:");
  publicMiddleware({ method: 'GET', url: '/public', headers: {} }, {}, () => {
    console.log("  [Success] Public access granted\n");
  });

  console.log("Secure endpoint:");
  const req5 = {
    method: 'GET',
    url: '/admin',
    headers: { authorization: 'Bearer token' }
  };
  secureMiddleware(req5, {}, () => {
    console.log("  [Success] Admin access granted\n");
  });

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same composition works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log("\nBenefits:");
  console.log("  ✓ Compose middleware chains once, use everywhere");
  console.log("  ✓ Reusable auth/logging/validation groups");
  console.log("  ✓ Consistent execution order");
  console.log("  ✓ ~50K+ downloads/week on npm!");
  console.log("\n✅ Use Cases:");
  console.log("- Authentication + authorization chains");
  console.log("- Logging + timing middleware groups");
  console.log("- Request validation pipelines");
  console.log("- Reusable middleware stacks");
}
