# Backo - Elide Polyglot Showcase

> **One backoff library for ALL languages** - TypeScript, Python, Ruby, and Java

Exponential backoff strategy for retry logic.

## Features

- Exponential backoff
- Jitter support
- Configurable delays
- Max attempts
- Custom strategies
- Zero dependencies

## Quick Start

```typescript
import { Backoff, backoff } from './elide-backo.ts';

// Use backoff class
const b = new Backoff({
  startingDelay: 100,
  timeMultiple: 2,
  jitter: 'full'
});

const delay = b.next(); // Get next delay

// Or use helper function
const result = await backoff(async () => {
  return await someUnreliableOperation();
}, {
  numOfAttempts: 5,
  startingDelay: 100
});
```

## Documentation

Run the demo:

```bash
elide run elide-backo.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/backo)

---

**Built with ❤️ for the Elide Polyglot Runtime**
