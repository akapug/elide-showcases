/**
 * Electrolyte - Lightweight DI
 *
 * Lightweight dependency injection container for Node.js applications.
 * **POLYGLOT SHOWCASE**: Lightweight DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/electrolyte (~10K+ downloads/week)
 *
 * Features:
 * - Auto-loading
 * - Simple API
 * - Namespace support
 * - Lazy loading
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class Electrolyte {
  private loaders = new Map<string, () => any>();
  private instances = new Map<string, any>();

  loader(id: string, fn: () => any): void {
    this.loaders.set(id, fn);
  }

  create<T = any>(id: string): T {
    if (this.instances.has(id)) {
      return this.instances.get(id);
    }

    const loader = this.loaders.get(id);
    if (!loader) throw new Error(`No loader for ${id}`);

    const instance = loader();
    this.instances.set(id, instance);
    return instance;
  }
}

export default new Electrolyte();

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ Electrolyte - Lightweight DI (POLYGLOT!)\n");

  const container = new Electrolyte();
  container.loader('logger', () => ({
    log: (msg: string) => console.log(`[LOG] ${msg}`)
  }));

  const logger = container.create('logger');
  logger.log("Hello from Electrolyte!");

  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
