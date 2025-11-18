# Superstruct - Elide Polyglot Showcase

> **One data validator for ALL languages** - TypeScript, Python, Ruby, and Java

A simple and composable way to validate data.

## Features

- Composable structs
- Type coercion
- Custom validators
- **~2M downloads/week on npm**

## Quick Start

```typescript
import superstruct from './elide-superstruct.ts';

const User = superstruct.object({
  name: superstruct.string(),
  age: superstruct.number()
});

const user = User.validate({ name: "Alice", age: 25 });
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
