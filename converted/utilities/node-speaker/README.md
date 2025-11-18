# node-speaker - Elide Polyglot Showcase

> **Audio output for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- PCM audio output to system speakers
- Support for various sample rates and bit depths
- Mono and stereo playback
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { Speaker, generateSineWave } from './elide-node-speaker.ts';

const speaker = new Speaker({
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100
});

const testAudio = generateSineWave(440, 1.0); // 440Hz for 1 second
speaker.write(testAudio);
speaker.end();
```

## Links

- [Original npm package](https://www.npmjs.com/package/speaker)

---

**Built with ❤️ for the Elide Polyglot Runtime**
