# React Native Device Info - Elide Polyglot Showcase

> **One device info library for ALL languages** - TypeScript, Python, Ruby, and Java

Get device information for React Native apps.

## Features

- Device model and brand
- OS version
- App version
- Unique device ID
- Battery info
- **~1M downloads/week on npm**

## Quick Start

```typescript
import DeviceInfo from './elide-react-native-device-info.ts';

console.log('Model:', DeviceInfo.getModel());
console.log('System:', DeviceInfo.getSystemName());
const uniqueId = await DeviceInfo.getUniqueId();
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-device-info.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-device-info)

---

**Built with ❤️ for the Elide Polyglot Runtime**
