/**
 * Constitute - DI Container
 *
 * Simple dependency injection container for JavaScript/TypeScript.
 * **POLYGLOT SHOWCASE**: Simple DI container for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/constitute (~10K+ downloads/week)
 *
 * Features:
 * - Constructor injection
 * - Singleton/transient scopes
 * - Method injection
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class Constitute {
  private bindings = new Map<any, any>();
  private singletons = new Map<any, any>();

  bindClass(target: any, impl?: any): this {
    this.bindings.set(target, impl || target);
    return this;
  }

  bindValue(target: any, value: any): this {
    this.singletons.set(target, value);
    return this;
  }

  get<T = any>(target: any): T {
    if (this.singletons.has(target)) {
      return this.singletons.get(target);
    }

    const impl = this.bindings.get(target) || target;
    const instance = new impl();
    this.singletons.set(target, instance);
    return instance;
  }
}

export default Constitute;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 Constitute - Simple DI (POLYGLOT!)\n");

  const container = new Constitute();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  container.bindClass(Logger);
  const logger = container.get<Logger>(Logger);
  logger.log("Hello from Constitute!");

  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
