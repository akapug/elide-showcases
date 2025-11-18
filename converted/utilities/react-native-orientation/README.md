# React Native Orientation - Elide Polyglot Showcase

> **One orientation library for ALL languages** - TypeScript, Python, Ruby, and Java

Listen to device orientation changes in React Native.

## Features

- Lock orientation
- Get current orientation
- Listen to changes
- Portrait/landscape modes
- Device-specific handling
- **~150K downloads/week on npm**

## Quick Start

```typescript
import Orientation from './elide-react-native-orientation.ts';

Orientation.lockToPortrait();

Orientation.addOrientationListener((orientation) => {
  console.log('Orientation:', orientation);
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-orientation.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-orientation)

---

**Built with ❤️ for the Elide Polyglot Runtime**
