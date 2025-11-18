# node-dependency-injection - Elide Polyglot Showcase

> **Full-featured DI container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Service definitions
- Parameters support
- Tags and references
- Auto-wiring
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import { ContainerBuilder } from './elide-node-dependency-injection.ts';

const container = new ContainerBuilder();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.register('logger', Logger);
const logger = container.get('logger');
logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-dependency-injection)

---

**Built with ❤️ for the Elide Polyglot Runtime**
