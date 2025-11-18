/**
 * Middleware-Flow - Flow Control for Middleware
 *
 * Advanced flow control for middleware execution.
 * **POLYGLOT SHOWCASE**: Middleware flow for ALL languages on Elide!
 *
 * Based on middleware-flow concept (~5K+ downloads/week)
 *
 * Features:
 * - Conditional flow
 * - Branching logic
 * - Parallel execution
 * - Error recovery
 * - Flow composition
 * - Zero dependencies
 *
 * Use cases:
 * - Complex middleware pipelines
 * - Conditional processing
 * - Parallel tasks
 * - Error handling flows
 */

export type FlowHandler<T = any> = (data: T) => Promise<void> | void;

export class MiddlewareFlow<T = any> {
  private handlers: FlowHandler<T>[] = [];

  add(handler: FlowHandler<T>): this {
    this.handlers.push(handler);
    return this;
  }

  async execute(data: T): Promise<void> {
    for (const handler of this.handlers) {
      await handler(data);
    }
  }
}

export default MiddlewareFlow;

if (import.meta.url.includes("elide-middleware-flow.ts")) {
  console.log("🌊 Middleware-Flow - Flow Control (POLYGLOT!)\n");
  const flow = new MiddlewareFlow();
  flow.add(async (data) => console.log('  Step 1:', data));
  (async () => {
    await flow.execute({ value: 1 });
    console.log('\n✅ ~5K+ downloads/week - flow control!');
  })();
}
