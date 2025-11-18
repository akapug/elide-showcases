# electrolyte - Elide Polyglot Showcase

> **Lightweight DI for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Auto-loading modules
- Namespace support
- Lazy loading
- Simple API
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import electrolyte from './elide-electrolyte.ts';

electrolyte.loader('logger', () => ({
  log: (msg) => console.log(msg)
}));

const logger = electrolyte.create('logger');
logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/electrolyte)

---

**Built with ❤️ for the Elide Polyglot Runtime**
