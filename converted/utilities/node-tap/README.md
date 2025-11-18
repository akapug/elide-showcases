# node-tap - Elide Polyglot Showcase

> **One TAP library for ALL languages** - TypeScript, Python, Ruby, and Java

A Test-Anything-Protocol library for Node.js.

## Features

- Full TAP version 13/14 support
- Coverage built-in
- Parallel test execution
- Snapshot testing
- TypeScript support
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import { test } from './elide-node-tap.ts';

test('basic test', (t) => {
  t.equal(1 + 1, 2, 'addition');
  t.ok(true, 'truthy');
  t.end();
});
```

## Documentation

Run the demo:

```bash
elide run elide-node-tap.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/tap)

---

**Built with ❤️ for the Elide Polyglot Runtime**
