# dependency-injection - Elide Polyglot Showcase

> **Lightweight dependency injection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Simple service registration
- Singleton management
- Factory functions
- Minimal API
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import { Container } from './elide-dependency-injection.ts';

const container = new Container();
class Logger {
  log(msg: string) { console.log(msg); }
}

container.register('logger', Logger);
const logger = container.resolve<Logger>('logger');
```

## Links

- [Original npm package](https://www.npmjs.com/package/dependency-injection)

---

**Built with ❤️ for the Elide Polyglot Runtime**
