# node-bluetooth - Elide Polyglot Showcase

> **Bluetooth communication for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Bluetooth device discovery
- RFCOMM connections
- Serial port emulation
- Cross-platform support

## Quick Start

```typescript
import { BluetoothSerialPort } from './elide-node-bluetooth.ts';

const bt = new BluetoothSerialPort();
bt.on('found', (address, name) => {
  console.log(`Found: ${name}`);
});
bt.inquire();
```

## Links

- Bluetooth communication library for Node.js

---

**Built with ❤️ for the Elide Polyglot Runtime**
