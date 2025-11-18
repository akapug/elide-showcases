# testcafe - Elide Polyglot Showcase

> **One E2E framework for ALL languages** - TypeScript, Python, Ruby, and Java

A Node.js tool to automate end-to-end web testing.

## Features

- No WebDriver
- Cross-browser testing
- Automatic waiting
- Parallel execution
- Live mode
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import { fixture, test } from './elide-testcafe.ts';

fixture('Login').page('https://example.com');

test('should login', async (t) => {
  await t.typeText('#username', 'alice');
  await t.click('#submit');
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/testcafe)

---

**Built with ❤️ for the Elide Polyglot Runtime**
