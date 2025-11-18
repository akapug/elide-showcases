# wire - Elide Polyglot Showcase

> **Flexible IoC container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Declarative wiring
- Plugin system
- Lifecycle management
- AOP support
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import { wire } from './elide-wire.ts';

const context = wire({
  logger: class Logger {
    log(msg: string) { console.log(msg); }
  }
});

context.logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/wire)

---

**Built with ❤️ for the Elide Polyglot Runtime**
