# johnny-five - Elide Polyglot Showcase

> **JavaScript robotics and IoT for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Board abstraction for Arduino, Raspberry Pi, BeagleBone
- Component library (LED, Servo, Motor, Sensor)
- Event-driven architecture
- **~30K+ downloads/week on npm**

## Quick Start

```typescript
import { Board, Led } from './elide-johnny-five.ts';

const board = new Board();
board.on('ready', () => {
  const led = new Led(13);
  led.blink(500);
});
```

## Components

- **Led**: Control LEDs with on/off/blink/fade
- **Servo**: Control servo motors
- **Sensor**: Read analog sensors
- **Motor**: Control DC motors
- **Thermometer**: Read temperature sensors

## Links

- [Original npm package](https://www.npmjs.com/package/johnny-five)

---

**Built with ❤️ for the Elide Polyglot Runtime**
