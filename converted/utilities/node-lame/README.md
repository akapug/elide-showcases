# node-lame - Elide Polyglot Showcase

> **MP3 encoding for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Encode PCM audio to MP3 format
- CBR, VBR, and ABR encoding modes
- ID3 tag support
- Quality presets
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import { Encoder, Presets } from './elide-node-lame.ts';

const encoder = new Encoder(Presets.STANDARD);
encoder.setTags({
  title: "My Song",
  artist: "Artist Name"
});

const pcmData = Buffer.alloc(44100 * 2 * 2); // 1 second stereo audio
const mp3Data = encoder.encode(pcmData);
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-lame)

---

**Built with ❤️ for the Elide Polyglot Runtime**
