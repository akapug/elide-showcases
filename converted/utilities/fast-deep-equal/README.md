# Fast Deep Equal (fast-deep-equal) - Elide Polyglot Showcase

> **One deep equality check for ALL languages** - TypeScript, Python, Ruby, and Java

Fast deep equality comparison with support for all JavaScript types across your entire polyglot stack.

## ✨ Features

- ✅ Fast deep equality comparison
- ✅ Support for primitives, objects, arrays
- ✅ Support for Date, RegExp, Map, Set
- ✅ Support for typed arrays and ArrayBuffer
- ✅ NaN equality (NaN === NaN returns true)
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Highly optimized

## 🚀 Quick Start

```typescript
import equal from './elide-fast-deep-equal.ts';

// Objects
equal({a: 1}, {a: 1})              // true
equal({a: 1}, {a: 2})              // false

// Arrays
equal([1, 2, 3], [1, 2, 3])        // true
equal([1, 2], [1, 2, 3])           // false

// Nested
equal({a: {b: 1}}, {a: {b: 1}})    // true

// Special types
equal(new Date(0), new Date(0))    // true
equal(/test/i, /test/i)            // true
equal(NaN, NaN)                    // true

// Collections
const map1 = new Map([['a', 1]]);
const map2 = new Map([['a', 1]]);
equal(map1, map2)                  // true
```

## 💡 Use Cases

### Testing

```typescript
function assertDeepEqual(actual: any, expected: any) {
  if (!equal(actual, expected)) {
    throw new Error('Values are not deeply equal');
  }
}
```

### Memoization

```typescript
const cache = new Map();

function memoize(fn: Function) {
  return (...args: any[]) => {
    for (const [cachedArgs, result] of cache) {
      if (equal(args, cachedArgs)) {
        return result;
      }
    }
    const result = fn(...args);
    cache.set(args, result);
    return result;
  };
}
```

## 📝 Package Stats

- **npm downloads**: ~120M/week
- **Use case**: Testing, memoization, change detection
- **Elide advantage**: One implementation for all languages

## 🌐 Links

- [npm fast-deep-equal package](https://www.npmjs.com/package/fast-deep-equal) (~120M downloads/week)

---

**Built with ❤️ for the Elide Polyglot Runtime**
