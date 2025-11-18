# webdriverio - Elide Polyglot Showcase

> **One WebDriver framework for ALL languages** - TypeScript, Python, Ruby, and Java

Next-gen browser and mobile automation test framework.

## Features

- WebDriver protocol
- Cross-browser testing
- Mobile testing
- Component testing
- Visual regression
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { remote } from './elide-webdriverio.ts';

const browser = await remote({ capabilities: { browserName: 'chrome' } });
await browser.url('https://example.com');
const button = await browser.$('button');
await button.click();
await browser.deleteSession();
```

## Links

- [Original npm package](https://www.npmjs.com/package/webdriverio)

---

**Built with ❤️ for the Elide Polyglot Runtime**
