# tsyringe - Elide Polyglot Showcase

> **Lightweight dependency injection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Constructor injection
- Multiple lifecycle options
- Child containers
- Factory registration
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import { DependencyContainer } from './elide-tsyringe.ts';

const container = new DependencyContainer();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.registerSingleton(Logger);
const logger = container.resolve(Logger);
logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/tsyringe)

---

**Built with ❤️ for the Elide Polyglot Runtime**
