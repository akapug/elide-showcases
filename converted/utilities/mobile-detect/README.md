# mobile-detect - Mobile Device Detection - Elide Polyglot Showcase

> **One mobile detector for ALL languages** - TypeScript, Python, Ruby, and Java

Detect mobile devices, tablets, and operating systems from User-Agent.

## ✨ Features

- ✅ Mobile phone detection
- ✅ Tablet detection
- ✅ OS detection (iOS, Android, Windows Phone)
- ✅ Version detection
- ✅ Device grade classification (A, B, C)
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import MobileDetect from './elide-mobile-detect.ts';

const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) ...';
const md = new MobileDetect(ua);

console.log(md.mobile());   // 'iPhone'
console.log(md.phone());    // 'iPhone'
console.log(md.tablet());   // null
console.log(md.os());       // 'iOS'
console.log(md.version('iOS'));  // 17.1
console.log(md.grade());    // 'A'

// Specific checks
console.log(md.is('iPhone'));  // true
console.log(md.is('iPad'));    // false
```

## 📖 API Reference

### `new MobileDetect(userAgent: string)`

Create a new MobileDetect instance.

### Methods

- `mobile()`: Returns device name if mobile, null otherwise
- `phone()`: Returns phone name if phone, null otherwise
- `tablet()`: Returns tablet name if tablet, null otherwise
- `os()`: Returns OS name
- `version(key)`: Returns OS version
- `is(key)`: Check if specific device/OS
- `grade()`: Returns device grade (A, B, C)

## 📝 Package Stats

- **npm downloads**: ~500K+/week
- **Use case**: Mobile device detection
- **Elide advantage**: One detector for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making mobile detection simple, everywhere.*
