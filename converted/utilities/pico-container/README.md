# pico-container - Elide Polyglot Showcase

> **Tiny DI container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Minimal API
- Lightweight
- Simple registration
- Fast resolution
- **~3K+ downloads/week on npm**

## Quick Start

```typescript
import { PicoContainer } from './elide-pico-container.ts';

const container = new PicoContainer();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.add('logger', () => new Logger());
const logger = container.resolve('logger');
```

## Links

- [Original npm package](https://www.npmjs.com/package/pico-container)

---

**Built with ❤️ for the Elide Polyglot Runtime**
