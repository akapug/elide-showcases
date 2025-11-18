# nightwatch - Elide Polyglot Showcase

> **One E2E solution for ALL languages** - TypeScript, Python, Ruby, and Java

End-to-end testing solution for web applications.

## Features

- Simple syntax
- Built-in test runner
- Selenium WebDriver
- Page object support
- Parallel testing
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import { createSession } from './elide-nightwatch.ts';

const browser = createSession();
browser
  .url('https://example.com')
  .click('#submit')
  .assert.visible('#welcome')
  .end();
```

## Links

- [Original npm package](https://www.npmjs.com/package/nightwatch)

---

**Built with ❤️ for the Elide Polyglot Runtime**
