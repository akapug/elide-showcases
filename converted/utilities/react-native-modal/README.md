# React Native Modal - Elide Polyglot Showcase

> **One modal library for ALL languages** - TypeScript, Python, Ruby, and Java

Enhanced modal component for React Native.

## Features

- Customizable animations
- Swipe to close
- Backdrop support
- Device orientation
- Accessibility
- **~600K downloads/week on npm**

## Quick Start

```typescript
import { Modal } from './elide-react-native-modal.ts';

const modal = new Modal({
  isVisible: true,
  animationType: 'slide',
  swipeDirection: 'down',
  onBackdropPress: () => console.log('Close'),
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-modal.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-modal)

---

**Built with ❤️ for the Elide Polyglot Runtime**
