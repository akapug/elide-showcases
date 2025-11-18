# React Native Bluetooth - Elide Polyglot Showcase

> **One Bluetooth library for ALL languages** - TypeScript, Python, Ruby, and Java

Bluetooth Low Energy (BLE) library for React Native.

## Features

- BLE scanning
- Device connection
- Service/characteristic discovery
- Read/write operations
- Notifications
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { BleManager } from './elide-react-native-bluetooth.ts';

const manager = new BleManager();

await manager.startDeviceScan(null, {}, (error, device) => {
  if (device) console.log('Found:', device.name);
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-bluetooth.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-ble-plx)

---

**Built with ❤️ for the Elide Polyglot Runtime**
