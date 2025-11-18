# headless-detector - Headless Browser Detection - Elide Polyglot Showcase

> **One headless detector for ALL languages** - TypeScript, Python, Ruby, and Java

Detect headless browsers and automation tools.

## ✨ Features

- ✅ Headless Chrome detection
- ✅ PhantomJS detection
- ✅ Puppeteer detection
- ✅ Playwright detection
- ✅ Selenium detection
- ✅ Confidence scoring
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { detectHeadless, isHeadless } from './elide-headless-detector.ts';

const info = detectHeadless('HeadlessChrome/120.0');
console.log(info);
// { isHeadless: true, tool: 'Headless Chrome', confidence: 'high' }

console.log(isHeadless('Puppeteer/1.0'));  // true
```

## 📝 Package Stats

- **npm downloads**: ~20K+/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
