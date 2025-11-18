# ServiceLocator - Elide Polyglot Showcase

> **Service locator pattern for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Service registration
- Service discovery
- Lazy loading
- Global registry
- **~5K+ downloads/week on npm**

## Quick Start

```typescript
import ServiceLocator from './elide-ServiceLocator.ts';

class Logger {
  log(msg: string) { console.log(msg); }
}

ServiceLocator.register('logger', Logger);
const logger = ServiceLocator.get('logger');
logger.log('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/ServiceLocator)

---

**Built with ❤️ for the Elide Polyglot Runtime**
