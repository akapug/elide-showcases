# pigpio - Elide Polyglot Showcase

> **Fast GPIO for Raspberry Pi** - TypeScript, Python, Ruby, and Java

## Features

- Fast GPIO operations
- Hardware PWM
- Servo control
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { Gpio } from './elide-pigpio.ts';

const led = new Gpio(17, { mode: 1 });
led.digitalWrite(1);
```

## Links

- [Original npm package](https://www.npmjs.com/package/pigpio)

---

**Built with ❤️ for the Elide Polyglot Runtime**
