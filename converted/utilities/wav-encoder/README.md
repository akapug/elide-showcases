# wav-encoder - Elide Polyglot Showcase

> **WAV encoding for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Encode to WAV format
- Multiple bit depths
- Promise-based API
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import { encode } from './elide-wav-encoder.ts';

const audioData = {
  sampleRate: 44100,
  channelData: [new Float32Array(44100)]
};

const wavBuffer = await encode(audioData);
```

## Links

- [Original npm package](https://www.npmjs.com/package/wav-encoder)

---

**Built with ❤️ for the Elide Polyglot Runtime**
