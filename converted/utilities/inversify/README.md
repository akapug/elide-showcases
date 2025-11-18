# inversify - Elide Polyglot Showcase

> **Powerful IoC container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Constructor and property injection
- Multiple binding scopes (Singleton, Transient, Request)
- Contextual bindings
- Symbol and string identifiers
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import { Container } from './elide-inversify.ts';

const container = new Container();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.bind(Logger).toSelf().inSingletonScope();

const logger = container.get(Logger);
logger.log('Hello DI!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/inversify)

---

**Built with ❤️ for the Elide Polyglot Runtime**
