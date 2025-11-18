# Runtypes - Elide Polyglot Showcase

> **One runtime validator for ALL languages** - TypeScript, Python, Ruby, and Java

Runtime validation for static types.

## Features

- Runtime type checking
- Static type inference
- Composable types
- **~500K downloads/week on npm**

## Quick Start

```typescript
import Runtype from './elide-runtypes.ts';

const User = Runtype.Record({ name: Runtype.String, age: Runtype.Number });
const user = User.check({ name: "Alice", age: 25 });
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
