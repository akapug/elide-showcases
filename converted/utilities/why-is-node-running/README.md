# why-is-node-running - Elide Polyglot Showcase

> **Debug why Node is still running for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Detect active handles
- Track timers and listeners
- Debug hanging processes
- **~3M downloads/week on npm**

## Quick Start

```typescript
import whyIsNodeRunning from './elide-why-is-node-running.ts';

// Your app code...
setTimeout(() => {}, 1000000);

// At the end, check why Node is still running
whyIsNodeRunning();
```

## Links

- [Original npm package](https://www.npmjs.com/package/why-is-node-running)

---

**Built with ❤️ for the Elide Polyglot Runtime**
