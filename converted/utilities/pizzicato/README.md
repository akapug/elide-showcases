# pizzicato - Elide Polyglot Showcase

> **Audio effects for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Audio effects (reverb, delay, distortion)
- Effect chaining
- Volume control
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { Sound, Distortion, Delay } from './elide-pizzicato.ts';

const sound = new Sound('sound.wav');
sound.addEffect(new Distortion(0.8));
sound.addEffect(new Delay(0.3, 0.6));
sound.play();
```

## Links

- [Original npm package](https://www.npmjs.com/package/pizzicato)

---

**Built with ❤️ for the Elide Polyglot Runtime**
