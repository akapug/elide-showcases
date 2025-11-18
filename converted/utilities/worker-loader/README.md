# worker-loader - Elide Polyglot Showcase

> **Web Workers for ALL frameworks**

## Features

- Web Worker creation
- Inline workers
- Message passing
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import { createWorker } from './elide-worker-loader.ts';

const worker = createWorker(() => {
  // Worker code
});

worker.postMessage({ type: 'start' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/worker-loader)

---

**Built with ❤️ for the Elide Polyglot Runtime**
