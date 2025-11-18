# io-ts - Elide Polyglot Showcase

> **One runtime type system for ALL languages** - TypeScript, Python, Ruby, and Java

Runtime type system for TypeScript with IO decoding/encoding.

## Features

- Runtime type validation
- Type-safe decoding
- Composable types
- **~3M downloads/week on npm**

## Quick Start

```typescript
import * as t from './elide-io-ts.ts';

const User = t.type({ name: t.string, age: t.number });
const user = User.decode({ name: "Alice", age: 25 });
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
