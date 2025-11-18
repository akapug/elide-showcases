# Pascal Case - Elide Polyglot Showcase

> **One PascalCase library for ALL languages** - TypeScript, Python, Ruby, and Java

Convert strings to PascalCase (UpperCamelCase) with consistent behavior across your entire polyglot stack.

## Why This Matters

Different PascalCase implementations create:
- Class naming inconsistencies
- Component name conflicts
- Code generation errors
- Contract violations

**Elide solves this** with ONE implementation.

## Quick Start

### TypeScript

```typescript
import pascalCase from './elide-pascal-case.ts';

pascalCase("foo-bar");      // "FooBar"
pascalCase("hello_world");  // "HelloWorld"
pascalCase("test case");    // "TestCase"
```

### Python

```python
from elide import require
pascal_case = require('./elide-pascal-case.ts')

result = pascal_case.default("foo-bar")  # "FooBar"
```

### Ruby

```ruby
pascal_case_module = Elide.require('./elide-pascal-case.ts')
result = pascal_case_module.default("foo-bar")  # "FooBar"
```

### Java

```java
String result = pascalCaseModule.getMember("default")
    .execute("foo-bar")
    .asString();  // "FooBar"
```

## Features

- Handles kebab-case, snake_case, camelCase, and spaces
- Preserves word boundaries intelligently
- Zero dependencies
- Pure TypeScript
- Type-safe API

## Package Stats

- **npm downloads**: ~8M/week (pascal-case package)
- **Polyglot score**: 22/50 (B-Tier)

## Use Cases

- Class name generation
- React/Vue component naming
- TypeScript interface definitions
- API contract generation
- Code scaffolding and generators

---

**Built with love for the Elide Polyglot Runtime**
