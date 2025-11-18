/**
 * SND Lib - DI Library
 *
 * Simple Node.js dependency injection library.
 * **POLYGLOT SHOWCASE**: Simple DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/snd-lib (~3K+ downloads/week)
 *
 * Features:
 * - Service management
 * - Dependency resolution
 * - Lazy loading
 * - Simple patterns
 * - Zero dependencies
 *
 * Package has ~3K+ downloads/week on npm!
 */

export class ServiceContainer {
  private services = new Map<string, any>();

  set(name: string, service: any): void {
    this.services.set(name, service);
  }

  get<T = any>(name: string): T {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service ${name} not found`);
    return typeof service === 'function' ? service() : service;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}

export default ServiceContainer;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📚 SND Lib - Simple DI Library (POLYGLOT!)\n");

  const container = new ServiceContainer();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  container.set('logger', () => new Logger());
  const logger = container.get<Logger>('logger');
  logger.log("Hello from SND Lib!");

  console.log("\n🚀 ~3K+ downloads/week on npm!");
}
