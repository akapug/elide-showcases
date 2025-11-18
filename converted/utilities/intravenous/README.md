# intravenous - Elide Polyglot Showcase

> **Tiny IoC container for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic dependency resolution
- Lifecycle management
- Factory functions
- Disposers
- **~5K+ downloads/week on npm**

## Quick Start

```typescript
import { create } from './elide-intravenous.ts';

const container = create();

class Logger {
  log(msg: string) { console.log(msg); }
}

container.register('logger', Logger);
const logger = container.get('logger');
```

## Links

- [Original npm package](https://www.npmjs.com/package/intravenous)

---

**Built with ❤️ for the Elide Polyglot Runtime**
