/**
 * Decorator Factory - Decorator Utilities
 *
 * Factory functions for creating TypeScript decorators.
 * **POLYGLOT SHOWCASE**: Decorator patterns for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/decorator-factory (~10K+ downloads/week)
 *
 * Features:
 * - Class decorators
 * - Method decorators
 * - Property decorators
 * - Parameter decorators
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export type ClassDecorator = <T extends Function>(target: T) => T | void;
export type MethodDecorator = (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor | void;
export type PropertyDecorator = (target: any, propertyKey: string | symbol) => void;
export type ParameterDecorator = (target: any, propertyKey: string | symbol, parameterIndex: number) => void;

export class DecoratorFactory {
  static createClassDecorator(fn: (target: any) => void): ClassDecorator {
    return function<T extends Function>(target: T): T {
      fn(target);
      return target;
    };
  }

  static createMethodDecorator(fn: (target: any, key: string | symbol, descriptor: PropertyDescriptor) => void): MethodDecorator {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
      fn(target, propertyKey, descriptor);
      return descriptor;
    };
  }

  static createPropertyDecorator(fn: (target: any, key: string | symbol) => void): PropertyDecorator {
    return function(target: any, propertyKey: string | symbol): void {
      fn(target, propertyKey);
    };
  }

  static createParameterDecorator(fn: (target: any, key: string | symbol, index: number) => void): ParameterDecorator {
    return function(target: any, propertyKey: string | symbol, parameterIndex: number): void {
      fn(target, propertyKey, parameterIndex);
    };
  }
}

export default DecoratorFactory;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🏭 Decorator Factory - Decorator Utilities (POLYGLOT!)\n");

  const Logged = DecoratorFactory.createMethodDecorator((target, key, descriptor) => {
    const original = descriptor.value;
    descriptor.value = function(...args: any[]) {
      console.log(`Calling ${String(key)} with args:`, args);
      return original.apply(this, args);
    };
  });

  class Calculator {
    @Logged
    add(a: number, b: number): number {
      return a + b;
    }
  }

  const calc = new Calculator();
  calc.add(5, 3);

  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
