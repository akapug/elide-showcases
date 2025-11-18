# constitute - Elide Polyglot Showcase

> **Simple DI container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Constructor injection
- Singleton management
- Method injection
- Simple API
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { Constitute } from './elide-constitute.ts';

const container = new Constitute();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.bindClass(Logger);
const logger = container.get(Logger);
logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/constitute)

---

**Built with ❤️ for the Elide Polyglot Runtime**
