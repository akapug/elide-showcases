/**
 * Pico Container - Tiny DI Container
 *
 * Minimalistic dependency injection container.
 * **POLYGLOT SHOWCASE**: Tiny DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/pico-container (~3K+ downloads/week)
 *
 * Features:
 * - Minimal API
 * - Lightweight
 * - Simple registration
 * - Fast resolution
 * - Zero dependencies
 *
 * Package has ~3K+ downloads/week on npm!
 */

export class PicoContainer {
  private registry = new Map<string, any>();
  private cache = new Map<string, any>();

  add(name: string, factory: any): this {
    this.registry.set(name, factory);
    return this;
  }

  resolve<T = any>(name: string): T {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const factory = this.registry.get(name);
    if (!factory) throw new Error(`${name} not found`);

    const instance = typeof factory === 'function' ? factory(this) : factory;
    this.cache.set(name, instance);
    return instance;
  }
}

export default PicoContainer;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🗃️ Pico Container - Tiny DI (POLYGLOT!)\n");

  const container = new PicoContainer();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  container.add('logger', () => new Logger());
  const logger = container.resolve<Logger>('logger');
  logger.log("Hello from Pico!");

  console.log("\n🚀 ~3K+ downloads/week on npm!");
}
