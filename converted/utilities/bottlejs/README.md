# bottlejs - Elide Polyglot Showcase

> **Micro DI container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Service registration
- Factory functions
- Decorators and middleware
- Provider pattern
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import { Bottle } from './elide-bottlejs.ts';

const bottle = new Bottle();

class Logger {
  log(msg: string) { console.log(msg); }
}

bottle.service('Logger', Logger);
bottle.container.Logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/bottlejs)

---

**Built with ❤️ for the Elide Polyglot Runtime**
