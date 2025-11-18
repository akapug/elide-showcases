# React Native Sensors - Elide Polyglot Showcase

> **One sensor library for ALL languages** - TypeScript, Python, Ruby, and Java

Access device sensors in React Native.

## Features

- Accelerometer
- Gyroscope
- Magnetometer
- Barometer
- Real-time data
- **~80K downloads/week on npm**

## Quick Start

```typescript
import { Accelerometer, Gyroscope } from './elide-react-native-sensors.ts';

const subscription = Accelerometer.subscribe((data) => {
  console.log(data);
});

// Later
subscription.unsubscribe();
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-sensors.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-sensors)

---

**Built with ❤️ for the Elide Polyglot Runtime**
