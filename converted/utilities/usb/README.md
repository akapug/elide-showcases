# usb - Elide Polyglot Showcase

> **USB device access for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Device enumeration
- Control/bulk/interrupt transfers
- Interface claiming
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { getDeviceList, findByIds } from './elide-usb.ts';

const devices = getDeviceList();
const device = findByIds(0x046d, 0xc52b);
device?.open();
```

## Links

- [Original npm package](https://www.npmjs.com/package/usb)

---

**Built with ❤️ for the Elide Polyglot Runtime**
