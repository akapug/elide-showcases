# node-hid - Elide Polyglot Showcase

> **USB HID device access for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Enumerate HID devices
- Read/write to HID devices
- Device event handling
- Cross-platform support
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import { HID } from './elide-node-hid.ts';

// List all devices
const devices = HID.devices();

// Open device by VID/PID
const device = new HID(0x046d, 0xc52b);

device.on('data', (data) => {
  console.log('Received:', data);
});

device.write([0x00, 0x01, 0x02]);
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-hid)

---

**Built with ❤️ for the Elide Polyglot Runtime**
