# diod - Elide Polyglot Showcase

> **Opinionated DI container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Type-safe container
- Builder pattern
- Auto-registration
- Scoped containers
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { ContainerBuilder } from './elide-diod.ts';

class Logger {
  log(msg: string) { console.log(msg); }
}

const container = new ContainerBuilder()
  .register(Logger)
  .build();

const logger = container.get(Logger);
logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/diod)

---

**Built with ❤️ for the Elide Polyglot Runtime**
