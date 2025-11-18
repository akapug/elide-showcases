# wav - Elide Polyglot Showcase

> **WAV audio codec for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- WAV file encoding and decoding
- Multiple bit depths (8, 16, 24, 32-bit)
- Mono and stereo support
- Metadata handling
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { encode, decode } from './elide-wav.ts';

// Encode PCM to WAV
const pcmData = Buffer.alloc(44100 * 2 * 2); // 1 second stereo
const wavData = encode(pcmData, {
  channels: 2,
  sampleRate: 44100,
  bitDepth: 16
});

// Decode WAV to PCM
const { format, pcm } = decode(wavData);
```

## Links

- [Original npm package](https://www.npmjs.com/package/wav)

---

**Built with ❤️ for the Elide Polyglot Runtime**
