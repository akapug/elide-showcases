# React Native Sound - Elide Polyglot Showcase

> **One audio library for ALL languages** - TypeScript, Python, Ruby, and Java

Sound module for playing audio in React Native.

## Features

- Audio playback
- Volume control
- Looping
- Pause/resume
- Multiple instances
- **~100K downloads/week on npm**

## Quick Start

```typescript
import Sound from './elide-react-native-sound.ts';

const sound = new Sound('song.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (!error) {
    sound.play();
  }
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-sound.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-sound)

---

**Built with ❤️ for the Elide Polyglot Runtime**
