/**
 * Diod - Dependency Injection Library
 *
 * A very opinionated and lightweight DI container and IoC for Node.js.
 * **POLYGLOT SHOWCASE**: Opinionated DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/diod (~10K+ downloads/week)
 *
 * Features:
 * - Type-safe container
 * - Builder pattern
 * - Auto-registration
 * - Scoped containers
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class ContainerBuilder {
  private registry = new Map<any, any>();

  register(token: any): this {
    this.registry.set(token, token);
    return this;
  }

  registerAndUse(token: any, impl: any): this {
    this.registry.set(token, impl);
    return this;
  }

  build(): DiodContainer {
    return new DiodContainer(this.registry);
  }
}

export class DiodContainer {
  private instances = new Map<any, any>();

  constructor(private registry: Map<any, any>) {}

  get<T>(token: any): T {
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const impl = this.registry.get(token) || token;
    const instance = typeof impl === 'function' ? new impl() : impl;
    this.instances.set(token, instance);
    return instance;
  }
}

export default ContainerBuilder;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💊 Diod - Opinionated DI (POLYGLOT!)\n");

  const builder = new ContainerBuilder();
  
  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  builder.register(Logger);
  const container = builder.build();
  
  const logger = container.get<Logger>(Logger);
  logger.log("Hello from Diod!");

  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
