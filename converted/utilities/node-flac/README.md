# node-flac - Elide Polyglot Showcase

> **FLAC lossless audio for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Lossless audio compression
- FLAC encoding and decoding
- Metadata support
- Compression levels 0-8
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { FlacEncoder } from './elide-node-flac.ts';

const encoder = new FlacEncoder({
  compressionLevel: 5,
  sampleRate: 44100,
  bitsPerSample: 16
});

encoder.setMetadata({
  title: "My Song",
  artist: "Artist Name"
});

const pcmData = Buffer.alloc(44100 * 2 * 2); // 1 second stereo
const flacData = encoder.encode(pcmData);
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-flac)

---

**Built with ❤️ for the Elide Polyglot Runtime**
