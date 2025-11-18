# dependable - Elide Polyglot Showcase

> **Minimalist DI for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Function parameter injection
- Auto-wiring
- Hash registration
- Override support
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { container } from './elide-dependable.ts';

const c = container();

class Logger {
  log(msg: string) { console.log(msg); }
}

c.register('logger', new Logger());
c.resolve((logger: Logger) => {
  logger.log('Hello!');
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/dependable)

---

**Built with ❤️ for the Elide Polyglot Runtime**
