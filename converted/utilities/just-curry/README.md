# Just Curry - Function Currying Utility

Transform functions to be callable with partial arguments - enable powerful functional programming patterns.

Based on [just-curry](https://www.npmjs.com/package/just-curry) (~20K+ downloads/week)

## Features

- 🍛 Automatic currying
- 🔧 Partial application support
- 🎯 Type-safe currying
- ⚙️ Custom arity support
- 🔗 Function composition
- 📦 Zero dependencies

## Quick Start

```typescript
import curry, { curryN } from './elide-just-curry.ts';

// Basic currying
function add(a: number, b: number, c: number) {
  return a + b + c;
}

const curriedAdd = curry(add);
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6
curriedAdd(1)(2, 3); // 6

// Partial application
const add5 = curriedAdd(5);
add5(10, 15); // 30

// Reusable configurations
function multiply(a: number, b: number) {
  return a * b;
}

const times = curry(multiply);
const double = times(2);
const triple = times(3);

[1, 2, 3].map(double); // [2, 4, 6]
[1, 2, 3].map(triple); // [3, 6, 9]
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const greet = curry((greeting, name) => `${greeting}, ${name}!`);
const sayHello = greet("Hello");
```

### Python (via Elide)
```python
from elide_just_curry import curry

greet = curry(lambda greeting, name: f"{greeting}, {name}!")
say_hello = greet("Hello")
```

### Ruby (via Elide)
```ruby
require 'elide/just_curry'

greet = Curry.new(->(greeting, name) { "#{greeting}, #{name}!" })
say_hello = greet.call("Hello")
```

### Java (via Elide)
```java
import elide.justcurry.Curry;

var greet = Curry.create((greeting, name) -> greeting + ", " + name + "!");
var sayHello = greet.apply("Hello");
```

## Use Cases

- **Partial application** - Pre-configure function parameters
- **Function composition** - Chain operations elegantly
- **Event handlers** - Bind specific parameters to callbacks
- **Configuration factories** - Create specialized versions
- **Array operations** - Reusable map/filter/reduce functions
- **Functional programming** - Enable FP patterns

## API

### `curry(func, arity?)`

Creates a curried version of the provided function.

**Parameters:**
- `func` - The function to curry
- `arity` - Number of parameters (default: func.length)

**Returns:** Curried function

### `curryN(n, func)`

Creates a curried version with explicit arity.

**Parameters:**
- `n` - Number of parameters required
- `func` - The function to curry

**Returns:** Curried function

## Why Elide?

- 🌐 **Polyglot** - One implementation for all languages
- ⚡ **Fast** - Native performance across all platforms
- 📦 **Zero dependencies** - Pure TypeScript implementation
- 🔄 **Consistent** - Same FP patterns in every language
- 🚀 **Production-ready** - Battle-tested pattern

Run the demo: `elide run elide-just-curry.ts`
