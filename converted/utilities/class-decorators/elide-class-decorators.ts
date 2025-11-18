/**
 * Class Decorators - Decorator Library
 *
 * Collection of useful class decorators for TypeScript.
 * **POLYGLOT SHOWCASE**: Class decorators for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/class-decorators (~5K+ downloads/week)
 *
 * Features:
 * - Sealed classes
 * - Frozen classes
 * - Deprecated warnings
 * - Mixins
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export function Sealed<T extends { new(...args: any[]): {} }>(constructor: T): T {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
  return constructor;
}

export function Frozen<T extends { new(...args: any[]): {} }>(constructor: T): T {
  Object.freeze(constructor);
  Object.freeze(constructor.prototype);
  return constructor;
}

export function Deprecated(message?: string) {
  return function<T extends { new(...args: any[]): {} }>(constructor: T): T {
    return class extends constructor {
      constructor(...args: any[]) {
        console.warn(`DEPRECATED: ${constructor.name} - ${message || 'This class is deprecated'}`);
        super(...args);
      }
    } as T;
  };
}

export function Mixin(...mixins: any[]) {
  return function<T extends { new(...args: any[]): {} }>(constructor: T): T {
    mixins.forEach(mixin => {
      Object.getOwnPropertyNames(mixin.prototype).forEach(name => {
        if (name !== 'constructor') {
          constructor.prototype[name] = mixin.prototype[name];
        }
      });
    });
    return constructor;
  };
}

export function Singleton<T extends { new(...args: any[]): {} }>(constructor: T): T {
  let instance: any;
  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) return instance;
      super(...args);
      instance = this;
    }
  } as T;
}

export default { Sealed, Frozen, Deprecated, Mixin, Singleton };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Class Decorators - Decorator Library (POLYGLOT!)\n");

  console.log("=== Sealed Class ===");
  @Sealed
  class SealedClass {
    value = 42;
  }
  const sealed = new SealedClass();
  console.log("Sealed instance:", sealed.value);

  console.log("\n=== Singleton Class ===");
  @Singleton
  class SingletonClass {
    id = Math.random();
  }
  const s1 = new SingletonClass();
  const s2 = new SingletonClass();
  console.log("Same instance:", s1 === s2);
  console.log("ID:", s1.id);

  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
