# node-ogg - Elide Polyglot Showcase

> **Ogg Vorbis codec for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Ogg Vorbis encoding/decoding
- Variable bitrate support
- Quality settings
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { Encoder, Decoder } from './elide-node-ogg.ts';

const encoder = new Encoder(44100, 2, 0.7);
const ogg = encoder.encode(pcmBuffer);
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-ogg)

---

**Built with ❤️ for the Elide Polyglot Runtime**
