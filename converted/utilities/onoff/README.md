# onoff - Elide Polyglot Showcase

> **GPIO access for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Read/write GPIO pins
- Interrupt detection
- Edge detection
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import Gpio from './elide-onoff.ts';

const led = new Gpio(17, 'out');
led.writeSync(1);

const button = new Gpio(4, 'in', 'both');
button.watch((err, value) => {
  console.log('Button:', value);
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/onoff)

---

**Built with ❤️ for the Elide Polyglot Runtime**
