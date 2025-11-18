# playwright-core - Elide Polyglot Showcase

> **One browser automation library for ALL languages** - TypeScript, Python, Ruby, and Java

Playwright core library for browser automation.

## Features

- Chromium, Firefox, WebKit
- Auto-wait for elements
- Network interception
- Screenshots & PDFs
- Mobile emulation
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import { chromium } from './elide-playwright-core.ts';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await page.click('button');
await browser.close();
```

## Links

- [Original npm package](https://www.npmjs.com/package/playwright-core)

---

**Built with ❤️ for the Elide Polyglot Runtime**
