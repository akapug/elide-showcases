# node-opus - Elide Polyglot Showcase

> **Opus voice/music codec for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Low-latency audio codec
- VoIP and music optimization
- Forward error correction (FEC)
- Variable bitrate (VBR)
- **~80K+ downloads/week on npm**

## Quick Start

```typescript
import { OpusEncoder, Applications } from './elide-node-opus.ts';

const encoder = new OpusEncoder(Applications.VOIP);
const pcmData = Buffer.alloc(16000 * 2); // 1 second mono
const opusData = encoder.encode(pcmData);
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-opus)

---

**Built with ❤️ for the Elide Polyglot Runtime**
