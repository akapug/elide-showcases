# React Native Gesture Handler - Elide Polyglot Showcase

> **One gesture system for ALL languages** - TypeScript, Python, Ruby, and Java

Declarative API for handling touch and gestures in React Native.

## Features

- Native-driven gesture handling
- Multiple gesture types (tap, pan, pinch, rotation, etc.)
- Gesture composition
- Touch event handling
- Gesture state management
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { TapGestureHandler, PanGestureHandler, PinchGestureHandler } from './elide-react-native-gesture-handler.ts';

const tapHandler = new TapGestureHandler({
  onGestureEvent: (e) => console.log('Tapped!'),
});
tapHandler.simulateTap(100, 200);

const panHandler = new PanGestureHandler({
  onGestureEvent: (e) => console.log('Panned:', e.nativeEvent.translationX),
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-gesture-handler.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-gesture-handler)
- [Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
