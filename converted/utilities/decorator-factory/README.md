# decorator-factory - Elide Polyglot Showcase

> **Decorator factory utilities for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Class decorators
- Method decorators
- Property decorators
- Parameter decorators
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { DecoratorFactory } from './elide-decorator-factory.ts';

const Logged = DecoratorFactory.createMethodDecorator((target, key, descriptor) => {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${String(key)}`);
    return original.apply(this, args);
  };
});

class Example {
  @Logged
  method() { }
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/decorator-factory)

---

**Built with ❤️ for the Elide Polyglot Runtime**
