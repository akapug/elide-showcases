# music-metadata - Elide Polyglot Showcase

> **Audio metadata parser for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse ID3, Vorbis, APE tags
- Support for MP3, FLAC, AAC, OGG, WAV
- Album art extraction
- Duration and format info
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import { parseFile } from './elide-music-metadata.ts';

const metadata = await parseFile('song.mp3');
console.log(`${metadata.common.title} by ${metadata.common.artist}`);
console.log(`Duration: ${metadata.format.duration}s`);
```

## Links

- [Original npm package](https://www.npmjs.com/package/music-metadata)

---

**Built with ❤️ for the Elide Polyglot Runtime**
