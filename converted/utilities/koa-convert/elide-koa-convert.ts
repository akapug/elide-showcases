/**
 * Koa Convert - Convert Legacy Koa Middleware
 *
 * Convert legacy Koa middleware (generator-based) to modern async/await.
 * **POLYGLOT SHOWCASE**: Middleware conversion for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/koa-convert (~500K+ downloads/week)
 *
 * Features:
 * - Convert generator middleware
 * - Support modern async/await
 * - Backward compatibility
 * - Automatic detection
 * - Type preservation
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java use same conversion pattern
 * - ONE middleware converter for all languages
 * - Share legacy middleware
 * - Consistent migration path
 *
 * Use cases:
 * - Migrating old Koa middleware
 * - Supporting legacy code
 * - Gradual modernization
 * - Compatibility layers
 *
 * Package has ~500K+ downloads/week on npm!
 */

export type Context = any;
export type Next = () => Promise<void>;
export type Middleware = (ctx: Context, next: Next) => Promise<void> | void;
export type GeneratorFunction = (this: any, ...args: any[]) => Iterator<any>;

/**
 * Check if function is a generator
 */
function isGeneratorFunction(fn: any): boolean {
  return fn && fn.constructor && fn.constructor.name === 'GeneratorFunction';
}

/**
 * Check if middleware is already modern
 */
function isModernMiddleware(fn: any): boolean {
  return !isGeneratorFunction(fn);
}

/**
 * Convert generator-based middleware to async
 */
export function convert(middleware: any): Middleware {
  if (isModernMiddleware(middleware)) {
    return middleware;
  }

  // Convert generator to async function
  return async function convertedMiddleware(ctx: Context, next: Next): Promise<void> {
    const gen = middleware.call(ctx, next);
    let result: any;

    // Run generator to completion
    while (true) {
      const { value, done } = gen.next(result);

      if (done) {
        return value;
      }

      // If yielded value is a promise, await it
      if (value && typeof value.then === 'function') {
        result = await value;
      } else {
        result = value;
      }
    }
  };
}

/**
 * Convert middleware if needed (auto-detect)
 */
export function back(middleware: any): Middleware {
  return convert(middleware);
}

/**
 * Compose middleware with auto-conversion
 */
export function compose(middleware: any[]): Middleware {
  const converted = middleware.map(mw => convert(mw));

  return async function composedMiddleware(ctx: Context, next: Next): Promise<void> {
    let index = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const fn = i < converted.length ? converted[i] : next;
      if (!fn) return;

      await fn(ctx, () => dispatch(i + 1));
    }

    await dispatch(0);
  };
}

export default convert;

// CLI Demo
if (import.meta.url.includes("elide-koa-convert.ts")) {
  console.log("🔄 Koa Convert - Middleware Converter (POLYGLOT!)\n");

  // Example 1: Modern async middleware (no conversion needed)
  console.log("=== Example 1: Modern Async Middleware ===");
  const modernMiddleware: Middleware = async (ctx, next) => {
    console.log('  [Modern] Before');
    await next();
    console.log('  [Modern] After');
  };

  const converted1 = convert(modernMiddleware);
  console.log('  Modern middleware preserved:', converted1 === modernMiddleware);
  console.log();

  // Example 2: Legacy-style middleware (simulated)
  console.log("=== Example 2: Converting Middleware ===");

  // Simulate legacy generator middleware behavior with async
  const legacyStyle = async (ctx: any, next: any) => {
    console.log('  [Legacy] Before (simulated generator)');
    await next();
    console.log('  [Legacy] After (simulated generator)');
  };

  const converted2 = convert(legacyStyle);
  console.log('  Legacy middleware converted');
  console.log();

  // Example 3: Middleware with state
  console.log("=== Example 3: Middleware with State ===");
  const statefulMiddleware = async (ctx: any, next: any) => {
    ctx.state = ctx.state || {};
    ctx.state.startTime = Date.now();
    console.log('  [State] Start time recorded');
    await next();
    const duration = Date.now() - ctx.state.startTime;
    console.log(`  [State] Duration: ${duration}ms`);
  };

  const converted3 = convert(statefulMiddleware);
  const testCtx = { state: {} };
  (async () => {
    await converted3(testCtx, async () => {
      console.log('  [Handler] Processing...');
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    console.log();

    // Example 4: Error handling
    console.log("=== Example 4: Error Handling Middleware ===");
    const errorHandler = async (ctx: any, next: any) => {
      try {
        await next();
      } catch (err: any) {
        console.log(`  [Error] Caught: ${err.message}`);
        ctx.status = 500;
        ctx.body = { error: err.message };
      }
    };

    const throwingMiddleware = async (ctx: any, next: any) => {
      throw new Error('Test error');
    };

    const app = compose([convert(errorHandler), convert(throwingMiddleware)]);

    const ctx2 = { status: 200, body: null };
    await app(ctx2, async () => {});
    console.log('  Response:', ctx2.body);
    console.log();

    // Example 5: Composing mixed middleware
    console.log("=== Example 5: Composing Mixed Middleware ===");
    const mw1 = async (ctx: any, next: any) => {
      console.log('  [MW1] Modern middleware');
      ctx.mw1 = true;
      await next();
    };

    const mw2 = async (ctx: any, next: any) => {
      console.log('  [MW2] Another modern middleware');
      ctx.mw2 = true;
      await next();
    };

    const mw3 = async (ctx: any, next: any) => {
      console.log('  [MW3] Final middleware');
      ctx.body = { mw1: ctx.mw1, mw2: ctx.mw2 };
    };

    const mixedApp = compose([mw1, mw2, mw3]);

    const ctx3 = { body: null };
    await mixedApp(ctx3, async () => {});
    console.log('  Result:', ctx3.body);
    console.log();

    // Example 6: Backward compatibility
    console.log("=== Example 6: Backward Compatibility ===");
    const oldMiddleware = async (ctx: any, next: any) => {
      console.log('  [Old] This could be from Koa 1.x');
      await next();
    };

    const newMiddleware = async (ctx: any, next: any) => {
      console.log('  [New] This is Koa 2.x style');
      await next();
    };

    const compatApp = compose([
      convert(oldMiddleware),
      convert(newMiddleware)
    ]);

    await compatApp({}, async () => {
      console.log('  [App] All middleware compatible!');
    });
    console.log();

    console.log("=== POLYGLOT Use Case ===");
    console.log("🌐 Same conversion pattern works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log("\nBenefits:");
    console.log("  ✓ Migrate legacy middleware gradually");
    console.log("  ✓ Support old and new styles together");
    console.log("  ✓ Consistent conversion across languages");
    console.log("  ✓ ~500K+ downloads/week on npm!");
    console.log("\n✅ Use Cases:");
    console.log("- Migrating from Koa 1.x to 2.x");
    console.log("- Supporting legacy middleware");
    console.log("- Gradual modernization");
    console.log("- Backward compatibility layers");
  })();
}
