# Zod - Elide Polyglot Showcase

> **One type-safe validator for ALL languages** - TypeScript, Python, Ruby, and Java

TypeScript-first schema declaration and validation library with static type inference.

## Features

- TypeScript-first with static type inference
- Zero dependencies
- Composable and immutable schemas
- Rich error messages
- Parse, don't validate philosophy
- **~45M downloads/week on npm**

## Quick Start

```typescript
import z from './elide-zod.ts';

const userSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().int().min(18).optional()
});

const user = userSchema.parse({
  username: "alice",
  email: "alice@example.com",
  age: 25
});
```

## Documentation

Run the demo:

```bash
elide run elide-zod.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/zod)

---

**Built with ❤️ for the Elide Polyglot Runtime**
