# React Native Reanimated - Elide Polyglot Showcase

> **One animation library for ALL languages** - TypeScript, Python, Ruby, and Java

React Native's new Animated library with native performance.

## Features

- Declarative animations API
- Runs on native thread
- Spring, timing, decay animations
- Interpolation
- Worklets for JS-based animations
- Gesture integration
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { useSharedValue, withTiming, withSpring } from './elide-react-native-reanimated.ts';

const offset = useSharedValue(0);
offset.value = withTiming(250, { duration: 500 });

const scale = useSharedValue(1);
scale.value = withSpring(1.5);
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-reanimated.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-reanimated)
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
