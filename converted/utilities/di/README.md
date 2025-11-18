# di - Elide Polyglot Showcase

> **Simple dependency injection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Constructor injection
- Module system
- Circular dependency detection
- Lazy instantiation
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import { Injector, inject } from './elide-di.ts';

class Logger {
  log(msg: string) { console.log(msg); }
}

const injector = new Injector([[Logger, Logger]]);
const logger = injector.get(Logger);
logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/di)

---

**Built with ❤️ for the Elide Polyglot Runtime**
