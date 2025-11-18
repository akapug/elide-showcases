# React Native Geolocation - Elide Polyglot Showcase

> **One geolocation library for ALL languages** - TypeScript, Python, Ruby, and Java

Geolocation API for React Native.

## Features

- Current position
- Watch position
- High accuracy
- Distance calculation
- Timeout handling
- **~200K downloads/week on npm**

## Quick Start

```typescript
import Geolocation from './elide-react-native-geolocation.ts';

Geolocation.getCurrentPosition(
  (position) => console.log(position.coords),
  (error) => console.error(error),
  { enableHighAccuracy: true }
);
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-geolocation.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/@react-native-community/geolocation)

---

**Built with ❤️ for the Elide Polyglot Runtime**
