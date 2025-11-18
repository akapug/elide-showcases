# React Native Fast Image - Elide Polyglot Showcase

> **One image library for ALL languages** - TypeScript, Python, Ruby, and Java

Performant React Native image component.

## Features

- Image caching
- Priority loading
- Preloading
- Progress tracking
- Resize modes
- **~700K downloads/week on npm**

## Quick Start

```typescript
import { FastImage, Priority, ResizeMode } from './elide-react-native-fast-image.ts';

const image = new FastImage({
  source: { uri: 'https://example.com/image.jpg', priority: Priority.HIGH },
  resizeMode: ResizeMode.COVER,
  onLoad: () => console.log('Loaded!'),
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-fast-image.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-fast-image)

---

**Built with ❤️ for the Elide Polyglot Runtime**
