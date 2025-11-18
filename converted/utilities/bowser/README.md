# bowser - Browser Detection Library - Elide Polyglot Showcase

> **One browser detector for ALL languages** - TypeScript, Python, Ruby, and Java

Parse User-Agent strings to detect browsers, engines, and platforms.

## ✨ Features

- ✅ Browser name and version detection
- ✅ OS platform detection
- ✅ Engine detection
- ✅ Browser satisfies version check
- ✅ Mobile/tablet/desktop classification
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { parse } from './elide-bowser.ts';

const ua = 'Mozilla/5.0 ... Chrome/120.0.0.0 ...';
const browser = parse(ua);

console.log(browser.getBrowser());    // { name: 'Chrome', version: '120.0' }
console.log(browser.getOS());         // { name: 'Windows', version: '10.0', ... }
console.log(browser.getPlatform());   // { type: 'desktop', ... }

// Version check
console.log(browser.satisfies({ chrome: '>=100' }));  // true

// Platform check
console.log(browser.is('desktop'));   // true
```

## 📝 Package Stats

- **npm downloads**: ~1M+/week
- **Use case**: Browser detection and compatibility
- **Elide advantage**: One detector for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making browser detection consistent, everywhere.*
