/**
 * DIY - DI Framework
 *
 * Do-it-yourself dependency injection framework.
 * **POLYGLOT SHOWCASE**: DIY DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/diy (~5K+ downloads/week)
 *
 * Features:
 * - Manual wiring
 * - Explicit dependencies
 * - No magic
 * - Simple patterns
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export class DIY {
  private services = new Map<string, any>();

  set(name: string, factory: () => any): void {
    this.services.set(name, factory);
  }

  get<T = any>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) throw new Error(`Service ${name} not found`);
    return factory();
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}

export default DIY;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔨 DIY - Do-It-Yourself DI (POLYGLOT!)\n");

  const container = new DIY();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  let loggerInstance: Logger | null = null;
  container.set('logger', () => {
    if (!loggerInstance) loggerInstance = new Logger();
    return loggerInstance;
  });

  const logger = container.get<Logger>('logger');
  logger.log("Hello from DIY!");

  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
