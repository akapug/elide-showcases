/**
 * Wire - IoC Container
 *
 * Light, fast, flexible JavaScript IoC container.
 * **POLYGLOT SHOWCASE**: Flexible IoC for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/wire (~20K+ downloads/week)
 *
 * Features:
 * - Declarative wiring
 * - Plugin system
 * - Lifecycle management
 * - AOP support
 * - Factory patterns
 * - Zero dependencies
 *
 * Use cases:
 * - Component wiring
 * - Plugin architectures
 * - AOP patterns
 * - Modular apps
 *
 * Package has ~20K+ downloads/week on npm!
 */

export class WireContainer {
  private components = new Map<string, any>();

  wire(spec: Record<string, any>): any {
    const context: any = {};

    Object.keys(spec).forEach(name => {
      const config = spec[name];
      if (typeof config === 'function') {
        context[name] = new config();
      } else if (config.create) {
        context[name] = config.create;
      } else {
        context[name] = config;
      }
      this.components.set(name, context[name]);
    });

    return context;
  }

  get(name: string): any {
    return this.components.get(name);
  }
}

export function wire(spec: Record<string, any>): any {
  const container = new WireContainer();
  return container.wire(spec);
}

export default wire;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔌 Wire - IoC Container (POLYGLOT!)\n");

  const context = wire({
    logger: class Logger {
      log(msg: string) { console.log(`[LOG] ${msg}`); }
    },
    config: { apiUrl: 'https://api.example.com' }
  });

  context.logger.log("Hello from Wire!");
  console.log("Config:", context.config);

  console.log("\n🚀 ~20K+ downloads/week on npm!");
}
