# puppeteer-core - Elide Polyglot Showcase

> **One headless browser library for ALL languages** - TypeScript, Python, Ruby, and Java

Puppeteer core library for headless Chrome/Chromium.

## Features

- Headless Chrome automation
- Screenshots & PDFs
- Form submission
- Keyboard & mouse input
- Network interception
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import puppeteer from './elide-puppeteer-core.ts';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await page.screenshot({ path: 'screenshot.png' });
await browser.close();
```

## Links

- [Original npm package](https://www.npmjs.com/package/puppeteer-core)

---

**Built with ❤️ for the Elide Polyglot Runtime**
