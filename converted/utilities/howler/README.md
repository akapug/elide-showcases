# howler - Elide Polyglot Showcase

> **Web audio library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Audio playback and control
- Sound sprite support
- 3D spatial audio
- Volume and fading
- **~300K+ downloads/week on npm**

## Quick Start

```typescript
import { Howl } from './elide-howler.ts';

const sound = new Howl({
  src: ['sound.mp3'],
  volume: 0.5,
  loop: true
});

sound.play();
sound.fade(1.0, 0.0, 2000); // Fade out over 2s
```

## Links

- [Original npm package](https://www.npmjs.com/package/howler)

---

**Built with ❤️ for the Elide Polyglot Runtime**
