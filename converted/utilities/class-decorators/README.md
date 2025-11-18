# class-decorators - Elide Polyglot Showcase

> **Class decorator library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Sealed classes
- Frozen classes
- Deprecated warnings
- Mixin support
- **~5K+ downloads/week on npm**

## Quick Start

```typescript
import { Sealed, Singleton } from './elide-class-decorators.ts';

@Sealed
class MyClass {
  value = 42;
}

@Singleton
class ConfigService {
  settings = {};
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/class-decorators)

---

**Built with ❤️ for the Elide Polyglot Runtime**
