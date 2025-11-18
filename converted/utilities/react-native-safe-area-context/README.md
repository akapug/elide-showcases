# React Native Safe Area Context - Elide Polyglot Showcase

> **One safe area solution for ALL languages** - TypeScript, Python, Ruby, and Java

Flexible way to handle safe area insets in React Native.

## Features

- Safe area insets (top, bottom, left, right)
- Supports notches and home indicators
- Context-based API
- Compatible with all devices
- Orientation support
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { useSafeAreaInsets, SafeAreaView } from './elide-react-native-safe-area-context.ts';

const insets = useSafeAreaInsets();
console.log('Top inset:', insets.top);

const safeView = new SafeAreaView({
  edges: ['top', 'bottom'],
  mode: 'padding',
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-safe-area-context.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-safe-area-context)
- [Safe Area Context Docs](https://github.com/th3rdwave/react-native-safe-area-context)

---

**Built with ❤️ for the Elide Polyglot Runtime**
