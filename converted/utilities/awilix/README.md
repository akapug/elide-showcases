# awilix - Elide Polyglot Showcase

> **Powerful IoC container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Cradle API with auto-completion
- Multiple lifetime options
- Scoped containers
- Disposer pattern
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import { createContainer, asClass, asValue } from './elide-awilix.ts';

const container = createContainer();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.register('logger', asClass(Logger).lifetime.SINGLETON);
container.cradle.logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/awilix)

---

**Built with ❤️ for the Elide Polyglot Runtime**
