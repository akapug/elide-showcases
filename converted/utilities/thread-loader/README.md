# thread-loader - Elide Polyglot Showcase

> **Parallel processing for ALL build systems**

## Features

- Worker pool management
- Parallel loader execution
- Configurable workers
- **~2M+ downloads/week on npm**

## Quick Start

```typescript
import { createThreadLoader } from './elide-thread-loader.ts';

const loader = createThreadLoader({ workers: 4 });
await loader.run(async () => {
  // Heavy processing
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/thread-loader)

---

**Built with ❤️ for the Elide Polyglot Runtime**
