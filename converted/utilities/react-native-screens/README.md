# React Native Screens - Elide Polyglot Showcase

> **One navigation system for ALL languages** - TypeScript, Python, Ruby, and Java

Native navigation primitives for React Native.

## Features

- Native screen management
- Stack navigation
- Memory optimization
- Native transitions
- Screen orientation
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { Screen, ScreenStack } from './elide-react-native-screens.ts';

const stack = new ScreenStack();

const homeScreen = new Screen({ children: 'Home' });
const detailScreen = new Screen({ children: 'Details' });

stack.push(homeScreen);
stack.push(detailScreen);
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-screens.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-screens)
- [React Native Screens Docs](https://github.com/software-mansion/react-native-screens)

---

**Built with ❤️ for the Elide Polyglot Runtime**
