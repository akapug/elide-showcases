# invariant - Elide Polyglot Showcase

> **Assert invariants for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Runtime assertions
- Development warnings
- Production-safe checks
- **~40M downloads/week on npm**

## Quick Start

```typescript
import invariant from './elide-invariant.ts';

function processUser(user: any) {
  invariant(user, 'User must be provided');
  invariant(user.id, 'User must have an ID');

  // Process user...
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/invariant)

---

**Built with ❤️ for the Elide Polyglot Runtime**
