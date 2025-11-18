# Just Compose - Function Composition Utility

Compose functions for elegant data transformations and pipelines.

Based on [just-compose](https://www.npmjs.com/package/just-compose) (~20K+ downloads/week)

## Features

- 🔗 Right-to-left composition
- ➡️ Left-to-right pipe
- 🎯 Type-safe composition
- 🔧 Variadic function support
- 🧹 Pure functional approach
- 📦 Zero dependencies

## Quick Start

```typescript
import { compose, pipe } from './elide-just-compose.ts';

// Compose (right-to-left)
const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;
const square = (x: number) => x * x;

const composed = compose(addOne, double, square);
composed(3); // square(3) -> double(9) -> addOne(18) = 19

// Pipe (left-to-right)
const piped = pipe(square, double, addOne);
piped(3); // square(3) -> double(9) -> addOne(18) = 19

// String transformations
const shout = compose(
  s => s + "!",
  s => s.toUpperCase(),
  s => s.trim()
);
shout("  hello  "); // "HELLO!"

// Data pipeline
const processUsers = pipe(
  users => users.filter(u => u.age >= 18),
  users => users.map(u => u.name),
  names => names.sort()
);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const transform = pipe(trim, toUpperCase, addExclamation);
```

### Python (via Elide)
```python
from elide_just_compose import pipe

transform = pipe(trim, to_upper_case, add_exclamation)
```

### Ruby (via Elide)
```ruby
require 'elide/just_compose'

transform = Pipe.new(trim, to_upper_case, add_exclamation)
```

### Java (via Elide)
```java
import elide.justcompose.Pipe;

var transform = Pipe.create(trim, toUpperCase, addExclamation);
```

## Use Cases

- **Data pipelines** - Transform data through multiple steps
- **Middleware** - Chain request/response handlers
- **Validation** - Sequential validation rules
- **Processing** - Multi-step data processing
- **Transformations** - String/array/object transformations
- **Functional programming** - Pure function composition

## API

### `compose(...fns)`

Compose functions right-to-left.

**Returns:** Composed function that executes fns from right to left

### `pipe(...fns)`

Compose functions left-to-right (Unix pipe style).

**Returns:** Piped function that executes fns from left to right

## Compose vs Pipe

- **compose**: Math-style, right-to-left: `f(g(h(x)))`
- **pipe**: Unix-style, left-to-right: `x |> h |> g |> f`

Both produce the same result, choose based on readability preference.

## Why Elide?

- 🌐 **Polyglot** - One implementation for all languages
- ⚡ **Fast** - Native performance across all platforms
- 📦 **Zero dependencies** - Pure TypeScript implementation
- 🔄 **Consistent** - Same FP patterns in every language
- 🚀 **Production-ready** - Battle-tested pattern

Run the demo: `elide run elide-just-compose.ts`
