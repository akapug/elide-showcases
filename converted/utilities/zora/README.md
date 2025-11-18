# zora - Elide Polyglot Showcase

> **One fast testing library for ALL languages** - TypeScript, Python, Ruby, and Java

Lightest, simplest and fastest testing library for JavaScript.

## Features

- Minimalist TAP output
- Async/await support
- Fast execution
- No global pollution
- Works anywhere
- Zero dependencies
- **~20K downloads/week on npm**

## Quick Start

```typescript
import { test } from './elide-zora.ts';

test('basic test', (t) => {
  t.equal(1 + 1, 2, 'addition');
  t.ok(true, 'truthy');
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/zora)

---

**Built with ❤️ for the Elide Polyglot Runtime**
