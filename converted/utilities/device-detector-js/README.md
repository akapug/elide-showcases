# device-detector-js - Advanced Device Detection - Elide Polyglot Showcase

> **One device detector for ALL languages** - TypeScript, Python, Ruby, and Java

Comprehensive device, browser, OS, and bot detection library.

## ✨ Features

- ✅ Detailed device type detection (smartphone, tablet, desktop, TV)
- ✅ Brand and model identification (Apple, Samsung, Google Pixel)
- ✅ Browser and engine parsing
- ✅ OS version detection
- ✅ Bot detection with categorization
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { parse, isMobile, getDeviceType } from './elide-device-detector-js.ts';

const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) ...';
const result = parse(ua);

console.log(result.device);  // { type: 'smartphone', brand: 'Apple', model: 'iPhone' }
console.log(result.client);  // { type: 'browser', name: 'Safari', version: '17.1', ... }
console.log(result.os);      // { name: 'iOS', version: '17.1', platform: 'ARM' }

console.log(isMobile(ua));       // true
console.log(getDeviceType(ua));  // 'smartphone'
```

## 📖 API Reference

### `parse(userAgent: string): DeviceResult`

Parse user agent and return detailed device information.

```typescript
interface DeviceResult {
  device: {
    type: 'smartphone' | 'tablet' | 'desktop' | 'tv' | null;
    brand: 'Apple' | 'Samsung' | 'Google' | null;
    model: string | null;
  };
  client: {
    type: 'browser' | null;
    name: string | null;
    version: string | null;
    engine: string | null;
    engineVersion: string | null;
  };
  os: {
    name: string | null;
    version: string | null;
    platform: string | null;
  };
  bot: {
    isBot: boolean;
    name: string | null;
    category: string | null;
  };
}
```

## 📝 Package Stats

- **npm downloads**: ~100K+/week
- **Use case**: Comprehensive device detection
- **Elide advantage**: One detector for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making device detection comprehensive, everywhere.*
