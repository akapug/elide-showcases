/**
 * Node IoC - IoC Container
 *
 * Simple IoC container for Node.js applications.
 * **POLYGLOT SHOWCASE**: Simple IoC for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/node-ioc (~5K+ downloads/week)
 *
 * Features:
 * - Class binding
 * - Instance binding
 * - Factory binding
 * - Singleton support
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export class IoCContainer {
  private bindings = new Map<any, any>();
  private instances = new Map<any, any>();

  bind(identifier: any): Binding {
    return new Binding(identifier, this);
  }

  _register(identifier: any, binding: any): void {
    this.bindings.set(identifier, binding);
  }

  resolve<T = any>(identifier: any): T {
    const binding = this.bindings.get(identifier);
    if (!binding) throw new Error(`No binding for ${identifier}`);

    if (binding.singleton && this.instances.has(identifier)) {
      return this.instances.get(identifier);
    }

    const instance = binding.factory(this);

    if (binding.singleton) {
      this.instances.set(identifier, instance);
    }

    return instance;
  }
}

class Binding {
  constructor(private identifier: any, private container: IoCContainer) {}

  to(impl: any): void {
    this.container._register(this.identifier, {
      factory: () => new impl(),
      singleton: true
    });
  }

  toValue(value: any): void {
    this.container._register(this.identifier, {
      factory: () => value,
      singleton: true
    });
  }

  toFactory(factory: (container: IoCContainer) => any): void {
    this.container._register(this.identifier, {
      factory,
      singleton: true
    });
  }
}

export default IoCContainer;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🏗️ Node IoC - Simple IoC Container (POLYGLOT!)\n");

  const container = new IoCContainer();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  container.bind(Logger).to(Logger);
  const logger = container.resolve<Logger>(Logger);
  logger.log("Hello from Node IoC!");

  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
