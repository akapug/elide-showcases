# brittle - Elide Polyglot Showcase

> **One TAP framework for ALL languages** - TypeScript, Python, Ruby, and Java

A simple TAP test framework.

## Features

- Simple TAP output
- Minimal API
- Async support
- Lightweight
- Zero dependencies
- **~5K downloads/week on npm**

## Quick Start

```typescript
import { test } from './elide-brittle.ts';

test('basic test', (t) => {
  t.is(1 + 1, 2, 'addition');
  t.ok(true, 'truthy');
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/brittle)

---

**Built with ❤️ for the Elide Polyglot Runtime**
