# puppeteer-extra-plugin-stealth - Stealth Mode Detection - Elide Polyglot Showcase

> **One stealth detector for ALL languages** - TypeScript, Python, Ruby, and Java

Detect and prevent bot detection evasion techniques.

## ✨ Features

- ✅ Detect stealth mode indicators
- ✅ WebDriver detection
- ✅ Chrome DevTools Protocol detection
- ✅ Automation fingerprints
- ✅ Scoring system (0-100)
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { detectStealth, getClientDetectionScript } from './elide-puppeteer-extra-plugin-stealth.ts';

const result = detectStealth('HeadlessChrome/120.0', { webdriver: true });
console.log(result);
// { isStealth: true, indicators: ['Headless UA', 'WebDriver present'], score: 90 }

// Client-side detection
const script = getClientDetectionScript();
```

## 📝 Package Stats

- **npm downloads**: ~100K+/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
