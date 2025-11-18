# snd-lib - Elide Polyglot Showcase

> **Simple DI library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Service management
- Dependency resolution
- Lazy loading
- Simple patterns
- **~3K+ downloads/week on npm**

## Quick Start

```typescript
import { ServiceContainer } from './elide-snd-lib.ts';

const container = new ServiceContainer();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.set('logger', () => new Logger());
const logger = container.get('logger');
```

## Links

- [Original npm package](https://www.npmjs.com/package/snd-lib)

---

**Built with ❤️ for the Elide Polyglot Runtime**
