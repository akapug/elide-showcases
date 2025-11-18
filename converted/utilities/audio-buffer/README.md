# audio-buffer - Elide Polyglot Showcase

> **Audio buffer utilities for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Create and manipulate audio buffers
- Multi-channel support
- Buffer slicing and concatenation
- Web Audio API compatible
- **~30K+ downloads/week on npm**

## Quick Start

```typescript
import { AudioBuffer, createBuffer } from './elide-audio-buffer.ts';

const buffer = createBuffer(2, 44100, 44100); // 1 second stereo

// Fill with audio data
const channel = buffer.getChannelData(0);
for (let i = 0; i < buffer.length; i++) {
  channel[i] = Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
}

// Slice and concatenate
const sliced = buffer.slice(1000, 2000);
```

## Links

- [Original npm package](https://www.npmjs.com/package/audio-buffer)

---

**Built with ❤️ for the Elide Polyglot Runtime**
