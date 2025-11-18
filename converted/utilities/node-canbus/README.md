# node-canbus - Elide Polyglot Showcase

> **CAN bus protocol for ALL languages** - ~5K+/week

## Features

- CAN bus communication
- Automotive applications
- Industrial equipment
- **~5K+ downloads/week on npm**

## Quick Start

```typescript
import { RawChannel } from './elide-node-canbus.ts';

const channel = new RawChannel('can0');
channel.start();
channel.addListener('onMessage', (msg) => {
  console.log('CAN message:', msg);
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-canbus)

---

**Built with ❤️ for the Elide Polyglot Runtime**
