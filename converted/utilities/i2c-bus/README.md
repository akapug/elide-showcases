# i2c-bus - Elide Polyglot Showcase

> **I2C serial bus access for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- I2C read/write operations
- Byte/word/block operations
- Async and sync APIs
- **~30K+ downloads/week on npm**

## Quick Start

```typescript
import { openSync } from './elide-i2c-bus.ts';

const bus = openSync(1);
const buffer = Buffer.alloc(4);
bus.i2cReadSync(0x48, 4, buffer);
bus.closeSync();
```

## Links

- [Original npm package](https://www.npmjs.com/package/i2c-bus)

---

**Built with ❤️ for the Elide Polyglot Runtime**
