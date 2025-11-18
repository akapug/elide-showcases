# React Native Video - Elide Polyglot Showcase

> **One video library for ALL languages** - TypeScript, Python, Ruby, and Java

Video component for React Native.

## Features

- Video playback
- Streaming support
- Full-screen mode
- Playback controls
- Subtitle support
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { Video } from './elide-react-native-video.ts';

const video = new Video({
  source: { uri: 'https://example.com/video.mp4' },
  onLoad: (data) => console.log('Loaded:', data),
});

video.load();
video.play();
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-video.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-video)

---

**Built with ❤️ for the Elide Polyglot Runtime**
