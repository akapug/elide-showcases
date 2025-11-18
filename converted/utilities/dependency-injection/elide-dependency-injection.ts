/**
 * Dependency Injection - DI Library
 *
 * Simple and lightweight dependency injection library.
 * **POLYGLOT SHOWCASE**: Lightweight DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dependency-injection (~20K+ downloads/week)
 *
 * Features:
 * - Service registration
 * - Factory functions
 * - Singleton management
 * - Simple API
 * - Lightweight
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need lightweight DI
 * - ONE implementation works everywhere on Elide
 * - Simple patterns across languages
 * - Easy to understand
 *
 * Use cases:
 * - Small applications
 * - Learning DI patterns
 * - Microservices
 * - Testing
 *
 * Package has ~20K+ downloads/week on npm!
 */

export class Container {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();

  register(name: string, service: any, singleton = true): void {
    this.services.set(name, { service, singleton });
  }

  resolve<T = any>(name: string): T {
    const entry = this.services.get(name);
    if (!entry) throw new Error(`Service ${name} not found`);

    if (entry.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    const instance = typeof entry.service === 'function' 
      ? new entry.service()
      : entry.service;

    if (entry.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }
}

export default Container;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💉 Dependency Injection - Lightweight DI (POLYGLOT!)\n");

  const container = new Container();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  container.register('logger', Logger);
  const logger = container.resolve<Logger>('logger');
  logger.log("Hello!");

  console.log("\n🚀 ~20K+ downloads/week on npm!");
}
