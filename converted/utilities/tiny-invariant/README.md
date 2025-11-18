# tiny-invariant - Elide Polyglot Showcase

> **Tiny invariant function for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Minimal size (< 200 bytes)
- TypeScript support
- Production optimized
- **~30M downloads/week on npm**

## Quick Start

```typescript
import invariant from './elide-tiny-invariant.ts';

function withdraw(amount: number) {
  invariant(amount > 0, 'Amount must be positive');
  invariant(amount <= 1000, 'Amount too large');

  // Process withdrawal...
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/tiny-invariant)

---

**Built with ❤️ for the Elide Polyglot Runtime**
