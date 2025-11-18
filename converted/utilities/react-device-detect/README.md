# react-device-detect - React Device Detection - Elide Polyglot Showcase

> **One device detector for ALL languages** - TypeScript, Python, Ruby, and Java

Device detection utilities for React applications and beyond.

## ✨ Features

- ✅ Mobile, tablet, desktop detection
- ✅ Browser detection (Chrome, Firefox, Safari, Edge)
- ✅ OS detection (iOS, Android, Windows, macOS)
- ✅ Device-specific conditionals
- ✅ SSR-friendly
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { detectDevice } from './elide-react-device-detect.ts';

const device = detectDevice(navigator.userAgent);

console.log(device.isMobile);     // true/false
console.log(device.browserName);  // 'Chrome'
console.log(device.osName);       // 'iOS'
console.log(device.deviceType);   // 'mobile'
```

### React
```typescript
function App() {
  const device = detectDevice(navigator.userAgent);

  return (
    <div>
      {device.isMobile && <MobileLayout />}
      {device.isDesktop && <DesktopLayout />}
    </div>
  );
}
```

## 📝 Package Stats

- **npm downloads**: ~300K+/week
- **Use case**: React device detection
- **Elide advantage**: Works beyond React

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making device detection reactive, everywhere.*
