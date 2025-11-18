# ismobilejs - Simple Mobile Detection - Elide Polyglot Showcase

> **One mobile checker for ALL languages** - TypeScript, Python, Ruby, and Java

Lightweight mobile, tablet, and phone detection utility.

## ✨ Features

- ✅ Apple device detection (iPhone, iPad, iPod)
- ✅ Android device detection
- ✅ Windows Phone detection
- ✅ Amazon device detection
- ✅ Simple API
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { isMobile } from './elide-ismobilejs.ts';

const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) ...';
const result = isMobile(ua);

console.log(result.any);          // true
console.log(result.phone);        // true
console.log(result.tablet);       // false
console.log(result.apple.phone);  // true
console.log(result.apple.tablet); // false
```

## 📝 Package Stats

- **npm downloads**: ~100K+/week
- **Use case**: Simple mobile detection
- **Elide advantage**: Lightweight and polyglot

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making mobile detection simple, everywhere.*
