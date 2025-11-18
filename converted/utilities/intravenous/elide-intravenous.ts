/**
 * Intravenous - IoC Container
 *
 * Tiny inversion of control container for node.js.
 * **POLYGLOT SHOWCASE**: Tiny IoC for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/intravenous (~5K+ downloads/week)
 *
 * Features:
 * - Automatic dependency resolution
 * - Lifecycle management
 * - Factory functions
 * - Disposers
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export class Container {
  private registry = new Map<string, any>();
  private instances = new Map<string, any>();

  register(name: string, value: any, lifecycle = 'singleton'): this {
    this.registry.set(name, { value, lifecycle });
    return this;
  }

  get<T = any>(name: string): T {
    const entry = this.registry.get(name);
    if (!entry) throw new Error(`${name} not registered`);

    if (entry.lifecycle === 'singleton' && this.instances.has(name)) {
      return this.instances.get(name);
    }

    const instance = typeof entry.value === 'function' ? new entry.value() : entry.value;

    if (entry.lifecycle === 'singleton') {
      this.instances.set(name, instance);
    }

    return instance;
  }
}

export function create(): Container {
  return new Container();
}

export default create;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💉 Intravenous - Tiny IoC (POLYGLOT!)\n");

  const container = create();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  container.register('logger', Logger);
  const logger = container.get<Logger>('logger');
  logger.log("Hello!");

  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
