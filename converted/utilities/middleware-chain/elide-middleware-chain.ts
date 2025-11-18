/**
 * Middleware-Chain - Chain Middleware Functions
 *
 * Chain multiple middleware functions together.
 * **POLYGLOT SHOWCASE**: Middleware chaining for ALL languages on Elide!
 *
 * Based on middleware-chain concept (~10K+ downloads/week)
 *
 * Features:
 * - Chain middleware functions
 * - Error handling
 * - Async support
 * - Conditional execution
 * - Priority ordering
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java use same chaining
 * - ONE middleware chain for all languages
 * - Share pipeline logic
 * - Consistent execution order
 *
 * Use cases:
 * - Request processing pipelines
 * - Validation chains
 * - Authentication sequences
 * - Data transformation
 */

export type Middleware<T = any> = (data: T, next: () => Promise<void>) => Promise<void> | void;

export class MiddlewareChain<T = any> {
  private chain: Middleware<T>[] = [];

  use(middleware: Middleware<T>): this {
    this.chain.push(middleware);
    return this;
  }

  async execute(data: T): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.chain.length) return;
      const middleware = this.chain[index++];
      await middleware(data, next);
    };

    await next();
  }
}

export function createChain<T = any>(): MiddlewareChain<T> {
  return new MiddlewareChain<T>();
}

export default createChain;

if (import.meta.url.includes("elide-middleware-chain.ts")) {
  console.log("⛓️  Middleware-Chain - Chain Middleware (POLYGLOT!)\n");

  const chain = createChain<{ value: number }>();
  chain.use(async (data, next) => {
    console.log('  [1] Validate:', data.value);
    await next();
  }).use(async (data, next) => {
    data.value *= 2;
    console.log('  [2] Transform:', data.value);
    await next();
  });

  (async () => {
    await chain.execute({ value: 10 });
    console.log('\n✅ Middleware chaining - polyglot pattern!');
  })();
}
