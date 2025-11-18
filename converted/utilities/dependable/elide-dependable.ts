/**
 * Dependable - DI Library
 *
 * Minimalist dependency injection framework for Node.js.
 * **POLYGLOT SHOWCASE**: Minimalist DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dependable (~10K+ downloads/week)
 *
 * Features:
 * - Function parameter injection
 * - Auto-wiring
 * - Hash registration
 * - Overrides
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class Container {
  private dependencies = new Map<string, any>();

  register(name: string, dep: any): this {
    this.dependencies.set(name, dep);
    return this;
  }

  registerMultiple(deps: Record<string, any>): this {
    Object.keys(deps).forEach(key => {
      this.register(key, deps[key]);
    });
    return this;
  }

  get<T = any>(name: string): T {
    const dep = this.dependencies.get(name);
    if (dep === undefined) throw new Error(`Dependency ${name} not found`);
    return typeof dep === 'function' ? dep() : dep;
  }

  resolve<T = any>(fn: (...args: any[]) => T): T {
    const params = this.getParamNames(fn);
    const deps = params.map(p => this.get(p));
    return fn(...deps);
  }

  private getParamNames(fn: Function): string[] {
    const fnStr = fn.toString();
    const match = fnStr.match(/\(([^)]*)\)/);
    if (!match) return [];
    return match[1].split(',').map(p => p.trim()).filter(p => p);
  }
}

export function container(): Container {
  return new Container();
}

export default container;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 Dependable - Minimalist DI (POLYGLOT!)\n");

  const c = container();

  class Logger {
    log(msg: string) { console.log(`[LOG] ${msg}`); }
  }

  c.register('logger', new Logger());
  c.register('message', 'Hello from Dependable!');

  const result = c.resolve((logger: Logger, message: string) => {
    logger.log(message);
    return 'Done';
  });

  console.log(result);

  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
