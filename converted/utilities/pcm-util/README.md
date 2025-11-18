# pcm-util - Elide Polyglot Showcase

> **PCM utilities for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- PCM normalization
- Sample mixing
- Stereo to mono conversion
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { normalize, mix, toMono } from './elide-pcm-util.ts';

const normalized = normalize(audioBuffer);
const mixed = mix(buffer1, buffer2, 0.5);
const mono = toMono(stereoBuffer, 2);
```

## Links

- [Original npm package](https://www.npmjs.com/package/pcm-util)

---

**Built with ❤️ for the Elide Polyglot Runtime**
