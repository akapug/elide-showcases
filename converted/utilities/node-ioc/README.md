# node-ioc - Elide Polyglot Showcase

> **Simple IoC container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Class binding
- Instance binding
- Factory binding
- Singleton support
- **~5K+ downloads/week on npm**

## Quick Start

```typescript
import { IoCContainer } from './elide-node-ioc.ts';

const container = new IoCContainer();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.bind(Logger).to(Logger);
const logger = container.resolve(Logger);
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-ioc)

---

**Built with ❤️ for the Elide Polyglot Runtime**
