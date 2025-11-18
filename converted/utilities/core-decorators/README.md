# core-decorators - Elide Polyglot Showcase

> **Essential decorators for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- @readonly decorator
- @deprecate decorator
- @debounce decorator
- @throttle decorator
- @memoize decorator
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { readonly, memoize, throttle } from './elide-core-decorators.ts';

class Example {
  @readonly
  PI = 3.14159;

  @memoize
  expensiveOperation(n: number) {
    return n * 2;
  }

  @throttle(1000)
  handleClick() {
    console.log('Clicked!');
  }
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/core-decorators)

---

**Built with ❤️ for the Elide Polyglot Runtime**
