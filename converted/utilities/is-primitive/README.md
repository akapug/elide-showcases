# is-primitive - Polyglot Type Validation

Check if a value is a primitive type (string, number, boolean, null, undefined) across TypeScript, Python, Ruby, and Java.

## Overview

- **Package**: is-primitive
- **Original**: github.com/jonschlinkert/is-primitive
- **Languages**: TypeScript, Python, Ruby, Java
- **Use Cases**: API validation, serialization checks, type guards

## Quick Start

### TypeScript
```typescript
import isPrimitive from "./elide-is-primitive.ts";

isPrimitive(5);          // true
isPrimitive("hello");    // true
isPrimitive(true);       // true
isPrimitive(null);       // true
isPrimitive(undefined);  // true
isPrimitive({});         // false
isPrimitive([]);         // false
isPrimitive(() => {});   // false
```

### Python (Conceptual)
```python
from elide import require
is_primitive = require('./elide-is-primitive.ts')

result = is_primitive.default(5)  # True
result = is_primitive.default({}) # False
```

### Ruby (Conceptual)
```ruby
is_primitive = Elide.require('./elide-is-primitive.ts')

is_primitive.default(5)   # true
is_primitive.default({})  # false
```

### Java (Conceptual)
```java
Context ctx = Context.newBuilder("js").build();
Value isPrimitive = ctx.eval("js",
    "require('./elide-is-primitive.ts').default");

boolean result = isPrimitive.execute(5).asBoolean();  // true
```

## Use Cases

### 1. API Validation
```typescript
function validatePrimitiveFields(data: any, fields: string[]) {
  for (const field of fields) {
    if (!isPrimitive(data[field])) {
      throw new Error(`${field} must be primitive type`);
    }
  }
}

const userData = { name: "John", age: 30, settings: {} };
validatePrimitiveFields(userData, ["name", "age"]);  // OK
validatePrimitiveFields(userData, ["settings"]);     // Error
```

### 2. Serialization Check
```typescript
function canSerializeDirectly(value: any): boolean {
  return isPrimitive(value);
}

canSerializeDirectly(5);        // true - can JSON.stringify
canSerializeDirectly({});       // false - needs recursive handling
```

### 3. Cache Key Generation
```typescript
function generateCacheKey(params: Record<string, any>): string {
  const primitiveParams = Object.entries(params)
    .filter(([_, v]) => isPrimitive(v))
    .sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify(primitiveParams);
}

const params = { id: 1, name: "test", callback: () => {} };
const key = generateCacheKey(params);  // Only includes id and name
```

### 4. Deep Clone Optimization
```typescript
function deepClone<T>(obj: T): T {
  if (isPrimitive(obj)) {
    return obj;  // Primitives don't need cloning
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as any;
  }

  if (typeof obj === 'object' && obj !== null) {
    const cloned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = deepClone(value);
    }
    return cloned;
  }

  return obj;
}
```

## Performance

- **Speed**: Millions of operations per second
- **Complexity**: O(1) constant time
- **Memory**: Zero allocations
- **Overhead**: Just two typeof checks

Run the benchmark:
```bash
elide benchmark.ts
```

## Files

- `elide-is-primitive.ts` - TypeScript implementation
- `elide-is-primitive.py` - Python integration example
- `elide-is-primitive.rb` - Ruby integration example
- `ElideIsPrimitiveExample.java` - Java integration example
- `benchmark.ts` - Performance benchmarks
- `CASE_STUDY.md` - Detailed case study
- `README.md` - This file

## Why Polyglot?

### Problem
Different languages handle primitive checking differently:
- JavaScript: `typeof x !== 'object'` (but typeof null === 'object'!)
- Python: Multiple isinstance checks
- Ruby: Different classes for primitives
- Java: Wrapper vs primitive types

### Solution
One implementation in TypeScript, usable from all languages via Elide polyglot.

### Benefits
1. **Consistency**: Same logic everywhere
2. **Maintainability**: Single source of truth
3. **Zero Dependencies**: No language-specific libraries needed
4. **Performance**: Native-speed via Elide

## License

MIT (matches original is-primitive package)
