# uvu - Elide Polyglot Showcase

> **One ultra-fast test runner for ALL languages** - TypeScript, Python, Ruby, and Java

Extremely fast and lightweight test runner for Node.js and the browser.

## Features

- Extremely lightweight (~5KB)
- 4x-5x faster than Jest
- Parallel test execution
- Individual file execution
- TAP-like output
- Zero dependencies
- **~300K downloads/week on npm**

## Quick Start

```typescript
import { suite, test, assert } from './elide-uvu.ts';

const math = suite('Math');

test(math, 'addition', () => {
  assert.is(1 + 1, 2);
});

math.run();
```

## Documentation

Run the demo:

```bash
elide run elide-uvu.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/uvu)

---

**Built with ❤️ for the Elide Polyglot Runtime**
