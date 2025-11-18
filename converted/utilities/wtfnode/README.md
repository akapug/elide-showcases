# wtfnode - Elide Polyglot Showcase

> **Debugging tool to dump all active handles for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Dump active handles and requests
- Track file descriptors
- Find process leaks
- **~500K downloads/week on npm**

## Quick Start

```typescript
import wtfnode from './elide-wtfnode.ts';

wtfnode.init();

// Your app code...

// Dump active handles when debugging
wtfnode.dump();
```

## Links

- [Original npm package](https://www.npmjs.com/package/wtfnode)

---

**Built with ❤️ for the Elide Polyglot Runtime**
