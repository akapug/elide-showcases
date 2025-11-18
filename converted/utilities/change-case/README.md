# Change Case - Elide Polyglot Showcase

> **One universal case conversion library for ALL languages** - TypeScript, Python, Ruby, and Java

Convert strings between any case format with consistent behavior across your entire polyglot stack.

## Why This Matters

Different case conversion implementations create:
- API field naming inconsistencies
- Database schema mismatches
- URL generation conflicts
- Code generation errors

**Elide solves this** with ONE comprehensive implementation.

## Quick Start

### TypeScript

```typescript
import { camelCase, snakeCase, kebabCase } from './elide-change-case.ts';

camelCase("hello-world");    // "helloWorld"
snakeCase("helloWorld");     // "hello_world"
kebabCase("hello_world");    // "hello-world"
```

### Python

```python
from elide import require
change_case = require('./elide-change-case.ts')

result = change_case.camelCase("hello-world")  # "helloWorld"
```

### Ruby

```ruby
change_case = Elide.require('./elide-change-case.ts')
result = change_case.camelCase("hello-world")  # "helloWorld"
```

### Java

```java
String result = changeCaseModule.getMember("camelCase")
    .execute("hello-world")
    .asString();  // "helloWorld"
```

## Available Conversions

- **camelCase** - First word lowercase, rest capitalized: `helloWorld`
- **PascalCase** - All words capitalized: `HelloWorld`
- **snake_case** - Lowercase with underscores: `hello_world`
- **kebab-case** - Lowercase with hyphens: `hello-world`
- **CONSTANT_CASE** - Uppercase with underscores: `HELLO_WORLD`
- **dot.case** - Lowercase with dots: `hello.world`
- **path/case** - Lowercase with slashes: `hello/world`
- **Sentence case** - First word capitalized: `Hello world`
- **Title Case** - All words capitalized with spaces: `Hello World`
- **lower case** - All lowercase with spaces: `hello world`
- **UPPER CASE** - All uppercase with spaces: `HELLO WORLD`
- **param-case** - Alias for kebab-case: `hello-world`
- **Header-Case** - Capitalized words with hyphens: `Hello-World`

## Package Stats

- **npm downloads**: ~15M/week (change-case package)
- **Polyglot score**: 25/50 (B-Tier)

## Use Cases

- API field transformations
- Code generation
- Database column naming
- URL slug generation
- Configuration file formats
- Variable renaming across codebases

---

**Built with love for the Elide Polyglot Runtime**
