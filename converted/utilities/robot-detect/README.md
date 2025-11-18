# robot-detect - Robot and Bot Detection - Elide Polyglot Showcase

> **One robot detector for ALL languages** - TypeScript, Python, Ruby, and Java

Detect robots, crawlers, and automated agents.

## ✨ Features

- ✅ Robot detection
- ✅ Crawler classification
- ✅ Headless browser detection
- ✅ Automation tool detection
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { detectRobot, isRobot } from './elide-robot-detect.ts';

const info = detectRobot('Googlebot/2.1');
console.log(info);  // { isRobot: true, type: 'search', name: 'Googlebot' }

console.log(isRobot('HeadlessChrome'));  // true
```

## 📝 Package Stats

- **npm downloads**: ~30K+/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
