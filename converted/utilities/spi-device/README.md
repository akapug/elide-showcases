# spi-device - Elide Polyglot Showcase

> **SPI serial bus access for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Full-duplex SPI transfers
- Configurable clock speed
- Multiple SPI modes
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { openSync } from './elide-spi-device.ts';

const device = openSync(0, 0);
const message = {
  sendBuffer: Buffer.from([0x01, 0x02]),
  receiveBuffer: Buffer.alloc(2),
};
device.transferSync([message]);
```

## Links

- [Original npm package](https://www.npmjs.com/package/spi-device)

---

**Built with ❤️ for the Elide Polyglot Runtime**
