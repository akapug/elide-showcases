# P-repeat - Elide Polyglot Showcase

> **One control flow library for ALL languages** - TypeScript, Python, Ruby, and Java

Control flow utilities for promise-based operations.

## Features

- Promise control flow
- Conditional loops
- Polling support
- Retry logic
- Timeout handling
- Zero dependencies

## Quick Start

```typescript
import { pWhilst, pTimes, until, poll } from './elide-p-repeat.ts';

// Run while condition is true
await pWhilst(
  () => hasMore(),
  async () => await processNext()
);

// Run N times
await pTimes(5, async (i) => {
  console.log(`Iteration ${i}`);
});

// Wait until condition is true
await until(() => isReady(), {
  interval: 100,
  timeout: 5000
});

// Poll until condition is met
const result = await poll(
  async () => await fetchStatus(),
  (status) => status === 'ready',
  { interval: 1000, timeout: 30000 }
);
```

## Documentation

Run the demo:

```bash
elide run elide-p-repeat.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/p-repeat)

---

**Built with ❤️ for the Elide Polyglot Runtime**
