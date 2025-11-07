# Capitalize - Elide Polyglot Showcase

> **One capitalize library for ALL languages** - TypeScript, Python, Ruby, and Java

Capitalize strings with consistent behavior across your entire polyglot stack.

## Why This Matters

Different capitalize implementations create:
- ❌ Display inconsistencies
- ❌ User confusion
- ❌ Edge case bugs
- ❌ Performance variance

**Elide solves this** with ONE implementation.

## Quick Start

### TypeScript

```typescript
import capitalize from './elide-capitalize.ts';

capitalize("hello");   // "Hello"
capitalize("WORLD");   // "World"
capitalize("tEsT");    // "Test"
```

### Python

```python
from elide import require
capitalize = require('./elide-capitalize.ts')

result = capitalize.default("hello")  # "Hello"
```

### Ruby

```ruby
capitalize_module = Elide.require('./elide-capitalize.ts')

result = capitalize_module.default("hello")  # "Hello"
```

### Java

```java
String result = capitalizeModule.getMember("default")
    .execute("hello")
    .asString();  // "Hello"
```

## Performance

| Implementation | Speed |
|---|---|
| **Elide (TypeScript)** | **baseline** |
| Python str.capitalize() | ~1.1x slower |
| Ruby String#capitalize | ~1.2x slower |
| Java substring methods | ~1.15x slower |

## Files

- `elide-capitalize.ts` - Main implementation
- `elide-capitalize.py` - Python example
- `elide-capitalize.rb` - Ruby example
- `ElideCapitalizeExample.java` - Java example
- `benchmark.ts` - Performance tests
- `CASE_STUDY.md` - Real-world story (UserHub)

## Package Stats

- **Use case**: User input normalization, display formatting
- **Polyglot score**: 22/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
