# diy - Elide Polyglot Showcase

> **DIY dependency injection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Manual wiring
- Explicit dependencies
- No magic
- Simple patterns
- **~5K+ downloads/week on npm**

## Quick Start

```typescript
import { DIY } from './elide-diy.ts';

const container = new DIY();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.set('logger', () => new Logger());
const logger = container.get('logger');
```

## Links

- [Original npm package](https://www.npmjs.com/package/diy)

---

**Built with ❤️ for the Elide Polyglot Runtime**
