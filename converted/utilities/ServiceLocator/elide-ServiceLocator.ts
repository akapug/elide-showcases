/**
 * ServiceLocator - Service Locator Pattern
 *
 * Service locator pattern implementation for dependency management.
 * **POLYGLOT SHOWCASE**: Service locator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ServiceLocator (~5K+ downloads/week)
 *
 * Features:
 * - Service registration
 * - Service discovery
 * - Lazy loading
 * - Global registry
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export class ServiceLocator {
  private static instance: ServiceLocator;
  private services = new Map<string, any>();

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  register(name: string, service: any): void {
    this.services.set(name, service);
  }

  get<T = any>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not found`);
    }
    const service = this.services.get(name);
    return typeof service === 'function' ? new service() : service;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  clear(): void {
    this.services.clear();
  }
}

export default ServiceLocator.getInstance();

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 ServiceLocator - Service Locator Pattern (POLYGLOT!)\n");

  const locator = ServiceLocator.getInstance();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  locator.register('logger', Logger);
  const logger = locator.get<Logger>('logger');
  logger.log("Hello from ServiceLocator!");

  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
