# fingerprint2 - Browser Fingerprinting (Legacy) - Elide Polyglot Showcase

> **One fingerprinting library for ALL languages** - TypeScript, Python, Ruby, and Java

Generate unique browser fingerprints for device identification.

## ✨ Features

- ✅ Browser fingerprinting
- ✅ Canvas fingerprinting
- ✅ WebGL fingerprinting
- ✅ Font detection
- ✅ Plugin detection
- ✅ Hash generation
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { get, getFingerprint, hashFingerprint } from './elide-fingerprint2.ts';

// Quick fingerprint
const fingerprint = get();
console.log(fingerprint);  // 'a1b2c3d4e5f6'

// Detailed components
const components = getFingerprint(navigator.userAgent);
const hash = hashFingerprint(components);
console.log(hash);
```

## 📝 Package Stats

- **npm downloads**: ~100K+/week

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Note: This is Fingerprint2 (legacy). See fingerprintjs for modern version.*
