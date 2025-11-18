# pcm-convert - Elide Polyglot Showcase

> **PCM audio conversion for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Sample rate conversion
- Bit depth conversion
- Channel conversion (mono/stereo)
- Format normalization
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import { convert, toMono, resample } from './elide-pcm-convert.ts';

// Convert format
const converted = convert(
  audioBuffer,
  { sampleRate: 44100, channels: 2, bitDepth: 16 },
  { sampleRate: 48000, channels: 2, bitDepth: 24 }
);

// Quick helpers
const mono = toMono(stereoBuffer);
const resampled = resample(buffer, 44100, 48000);
```

## Links

- [Original npm package](https://www.npmjs.com/package/pcm-convert)

---

**Built with ❤️ for the Elide Polyglot Runtime**
