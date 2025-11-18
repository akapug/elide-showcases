# rpi-gpio - Elide Polyglot Showcase

> **Raspberry Pi GPIO for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Read/write GPIO pins
- BCM/WiringPi modes
- **~15K+ downloads/week on npm**

## Quick Start

```typescript
import { setup, write } from './elide-rpi-gpio.ts';

await setup(17, 'out');
await write(17, 1);
```

## Links

- [Original npm package](https://www.npmjs.com/package/rpi-gpio)

---

**Built with ❤️ for the Elide Polyglot Runtime**
