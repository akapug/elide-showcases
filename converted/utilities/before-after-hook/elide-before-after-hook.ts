/**
 * Before-After-Hook - Hook Pattern Implementation
 *
 * Asynchronous before/after hook pattern for wrapping method calls.
 * **POLYGLOT SHOWCASE**: Hook pattern for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/before-after-hook (~2M+ downloads/week)
 *
 * Features:
 * - Before/after hooks
 * - Error hooks
 * - Async/await support
 * - Multiple hooks
 * - Hook removal
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java use same hook pattern
 * - ONE before/after system for all languages
 * - Share method wrapping logic
 * - Consistent interception
 *
 * Use cases:
 * - Method interception
 * - Logging/monitoring
 * - Validation
 * - Authorization
 *
 * Package has ~2M+ downloads/week on npm!
 */

export type HookCallback<T = any, R = any> = (options?: T) => R | Promise<R>;
export type BeforeHook<T = any> = (options: T) => void | Promise<void>;
export type AfterHook<T = any, R = any> = (result: R, options: T) => void | Promise<void>;
export type ErrorHook<T = any> = (error: Error, options: T) => void | Promise<void>;

export interface HookCollection<T = any, R = any> {
  before: BeforeHook<T>[];
  after: AfterHook<T, R>[];
  error: ErrorHook<T>[];
}

export class Hook<T = any, R = any> {
  private hooks: Map<string, HookCollection<T, R>> = new Map();

  /**
   * Register a before hook
   */
  before(name: string, hook: BeforeHook<T>): void {
    this.ensureHooks(name);
    this.hooks.get(name)!.before.push(hook);
  }

  /**
   * Register an after hook
   */
  after(name: string, hook: AfterHook<T, R>): void {
    this.ensureHooks(name);
    this.hooks.get(name)!.after.push(hook);
  }

  /**
   * Register an error hook
   */
  error(name: string, hook: ErrorHook<T>): void {
    this.ensureHooks(name);
    this.hooks.get(name)!.error.push(hook);
  }

  /**
   * Wrap a method with hooks
   */
  wrap(name: string, method: HookCallback<T, R>): HookCallback<T, R> {
    return async (options?: T): Promise<R> => {
      const collection = this.hooks.get(name);

      try {
        // Run before hooks
        if (collection?.before) {
          for (const hook of collection.before) {
            await hook(options as T);
          }
        }

        // Run original method
        const result = await method(options);

        // Run after hooks
        if (collection?.after) {
          for (const hook of collection.after) {
            await hook(result, options as T);
          }
        }

        return result;
      } catch (error) {
        // Run error hooks
        if (collection?.error) {
          for (const hook of collection.error) {
            await hook(error as Error, options as T);
          }
        }
        throw error;
      }
    };
  }

  /**
   * Remove all hooks for a method
   */
  remove(name: string): void {
    this.hooks.delete(name);
  }

  private ensureHooks(name: string): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, { before: [], after: [], error: [] });
    }
  }
}

export function createHook<T = any, R = any>(): Hook<T, R> {
  return new Hook<T, R>();
}

export default Hook;

// CLI Demo
if (import.meta.url.includes("elide-before-after-hook.ts")) {
  console.log("🪝 Before-After-Hook - Hook Pattern (POLYGLOT!)\n");

  // Example 1: Basic before/after hooks
  console.log("=== Example 1: Basic Before/After Hooks ===");
  const hook = createHook<{ name: string }, string>();

  hook.before('greet', async (options) => {
    console.log(`  [Before] About to greet ${options.name}`);
  });

  hook.after('greet', async (result, options) => {
    console.log(`  [After] Greeted with: "${result}"`);
  });

  const greet = hook.wrap('greet', async (options?: { name: string }) => {
    const message = `Hello, ${options?.name}!`;
    console.log(`  [Method] ${message}`);
    return message;
  });

  (async () => {
    await greet({ name: 'Alice' });
    console.log();

    // Example 2: Error handling
    console.log("=== Example 2: Error Hooks ===");
    hook.error('validate', async (error, options) => {
      console.log(`  [Error Hook] Caught: ${error.message}`);
      console.log(`  [Error Hook] Options:`, options);
    });

    hook.before('validate', async (options) => {
      console.log(`  [Before] Validating...`);
    });

    const validate = hook.wrap('validate', async (options?: { value: number }) => {
      if (!options?.value || options.value < 0) {
        throw new Error('Invalid value');
      }
      return 'Valid';
    });

    try {
      await validate({ value: -1 });
    } catch (e) {
      console.log(`  [Main] Error propagated to caller`);
    }
    console.log();

    // Example 3: Multiple hooks
    console.log("=== Example 3: Multiple Hooks ===");
    const multiHook = createHook<{ user: string }, any>();

    multiHook.before('save', async (options) => {
      console.log(`  [Validation] Checking ${options.user}...`);
    });

    multiHook.before('save', async (options) => {
      console.log(`  [Authorization] Verifying permissions...`);
    });

    multiHook.after('save', async (result, options) => {
      console.log(`  [Logger] Saved: ${JSON.stringify(result)}`);
    });

    multiHook.after('save', async (result, options) => {
      console.log(`  [Notification] Sending notification...`);
    });

    const save = multiHook.wrap('save', async (options?: { user: string }) => {
      console.log(`  [Method] Saving ${options?.user}...`);
      return { id: 123, user: options?.user };
    });

    await save({ user: 'bob@example.com' });
    console.log();

    // Example 4: Timing hooks
    console.log("=== Example 4: Timing Hooks ===");
    const timingHook = createHook<any, any>();

    let startTime: number;

    timingHook.before('query', async () => {
      startTime = Date.now();
      console.log(`  [Timer] Starting...`);
    });

    timingHook.after('query', async () => {
      const duration = Date.now() - startTime;
      console.log(`  [Timer] Completed in ${duration}ms`);
    });

    const query = timingHook.wrap('query', async () => {
      console.log(`  [Method] Executing query...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return { rows: [1, 2, 3] };
    });

    await query();
    console.log();

    // Example 5: API request wrapper
    console.log("=== Example 5: API Request Wrapper ===");
    interface RequestOptions {
      url: string;
      method: string;
    }

    const apiHook = createHook<RequestOptions, any>();

    apiHook.before('request', async (options) => {
      console.log(`  [Auth] Adding authorization header`);
      console.log(`  [Logger] ${options.method} ${options.url}`);
    });

    apiHook.after('request', async (result, options) => {
      console.log(`  [Cache] Caching response for ${options.url}`);
      console.log(`  [Metrics] Recording response time`);
    });

    apiHook.error('request', async (error, options) => {
      console.log(`  [Retry] Request failed for ${options.url}`);
      console.log(`  [Alert] Sending error notification`);
    });

    const request = apiHook.wrap('request', async (options?: RequestOptions) => {
      console.log(`  [HTTP] ${options?.method} ${options?.url}`);
      return { status: 200, data: { message: 'Success' } };
    });

    await request({ url: '/api/users', method: 'GET' });
    console.log();

    // Example 6: Transaction hooks
    console.log("=== Example 6: Transaction Hooks ===");
    const txHook = createHook<any, any>();

    txHook.before('transaction', async () => {
      console.log(`  [DB] BEGIN TRANSACTION`);
    });

    txHook.after('transaction', async (result) => {
      console.log(`  [DB] COMMIT TRANSACTION`);
      console.log(`  [Result] ${result.affected} rows affected`);
    });

    txHook.error('transaction', async (error) => {
      console.log(`  [DB] ROLLBACK TRANSACTION`);
      console.log(`  [Error] ${error.message}`);
    });

    const transaction = txHook.wrap('transaction', async () => {
      console.log(`  [DB] UPDATE users SET active = true`);
      console.log(`  [DB] INSERT INTO audit_log VALUES (...)`);
      return { affected: 5 };
    });

    await transaction();
    console.log();

    console.log("=== POLYGLOT Use Case ===");
    console.log("🌐 Same hook pattern works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log("\nBenefits:");
    console.log("  ✓ Wrap methods with hooks everywhere");
    console.log("  ✓ Share validation/auth/logging logic");
    console.log("  ✓ Consistent method interception");
    console.log("  ✓ ~2M+ downloads/week on npm!");
    console.log("\n✅ Use Cases:");
    console.log("- Method interception");
    console.log("- Logging and monitoring");
    console.log("- Validation and authorization");
    console.log("- Transaction management");
  })();
}
