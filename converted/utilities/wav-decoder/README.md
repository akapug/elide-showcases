# wav-decoder - Elide Polyglot Showcase

> **WAV decoding for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Decode WAV files
- Extract PCM audio data
- Promise-based API
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import { decode } from './elide-wav-decoder.ts';

const wavBuffer = new ArrayBuffer(1024);
const audioData = await decode(wavBuffer);
console.log(audioData.sampleRate);
```

## Links

- [Original npm package](https://www.npmjs.com/package/wav-decoder)

---

**Built with ❤️ for the Elide Polyglot Runtime**
