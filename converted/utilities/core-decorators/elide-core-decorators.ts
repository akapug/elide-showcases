/**
 * Core Decorators - Essential Decorators
 *
 * Library of JavaScript stage 0 decorators for common patterns.
 * **POLYGLOT SHOWCASE**: Core decorators for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/core-decorators (~100K+ downloads/week)
 *
 * Features:
 * - @readonly
 * - @deprecate
 * - @debounce
 * - @throttle
 * - @memoize
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export function readonly(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  descriptor.writable = false;
  return descriptor;
}

export function deprecate(message?: string) {
  return function(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value;
    descriptor.value = function(...args: any[]) {
      console.warn(`DEPRECATED: ${key} - ${message || 'This method is deprecated'}`);
      return original.apply(this, args);
    };
    return descriptor;
  };
}

export function debounce(ms: number) {
  return function(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value;
    let timeout: any;

    descriptor.value = function(...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => original.apply(this, args), ms);
    };

    return descriptor;
  };
}

export function throttle(ms: number) {
  return function(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value;
    let lastCall = 0;

    descriptor.value = function(...args: any[]) {
      const now = Date.now();
      if (now - lastCall >= ms) {
        lastCall = now;
        return original.apply(this, args);
      }
    };

    return descriptor;
  };
}

export function memoize(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const original = descriptor.value;
  const cache = new Map();

  descriptor.value = function(...args: any[]) {
    const cacheKey = JSON.stringify(args);
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    const result = original.apply(this, args);
    cache.set(cacheKey, result);
    return result;
  };

  return descriptor;
}

export function autobind(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const original = descriptor.value;

  return {
    configurable: true,
    get() {
      const bound = original.bind(this);
      Object.defineProperty(this, key, {
        value: bound,
        configurable: true,
        writable: true
      });
      return bound;
    }
  };
}

export default { readonly, deprecate, debounce, throttle, memoize, autobind };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⭐ Core Decorators - Essential Decorators (POLYGLOT!)\n");

  class Example {
    @readonly
    PI = 3.14159;

    @deprecate('Use newMethod() instead')
    oldMethod() {
      return 'old';
    }

    @memoize
    fibonacci(n: number): number {
      if (n <= 1) return n;
      return this.fibonacci(n - 1) + this.fibonacci(n - 2);
    }

    @throttle(1000)
    handleClick() {
      console.log('Click handled at', new Date().toISOString());
    }
  }

  const example = new Example();

  console.log("=== Readonly ===");
  console.log("PI:", example.PI);

  console.log("\n=== Deprecate ===");
  example.oldMethod();

  console.log("\n=== Memoize ===");
  console.log("Fibonacci(10):", example.fibonacci(10));
  console.log("Fibonacci(10) (cached):", example.fibonacci(10));

  console.log("\n=== Throttle ===");
  example.handleClick();
  example.handleClick(); // Will be throttled

  console.log("\n🚀 ~100K+ downloads/week on npm!");
}
