# tape - Elide Polyglot Showcase

> **One TAP test framework for ALL languages** - TypeScript, Python, Ruby, and Java

Tap-producing test harness for node and browsers.

## Features

- TAP (Test Anything Protocol) output
- No global state
- Works in Node and browsers
- Simple API
- No configuration needed
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import test from './elide-tape.ts';

test('basic test', (t) => {
  t.ok(true, 'true is truthy');
  t.equal(1 + 1, 2, 'addition');
  t.end();
});
```

## Documentation

Run the demo:

```bash
elide run elide-tape.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/tape)

---

**Built with ❤️ for the Elide Polyglot Runtime**
