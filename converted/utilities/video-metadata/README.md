# Video Metadata - Elide Polyglot Showcase

> **One metadata extractor for ALL languages** - TypeScript, Python, Ruby, and Java

Extract comprehensive metadata from video files.

## Features

- Duration, resolution, codec extraction
- Audio track details
- Format detection
- Bitrate and FPS info
- **~20K downloads/week on npm**

## Quick Start

```typescript
import extract from './elide-video-metadata.ts';

const meta = await extract('video.mp4');
console.log(meta.duration, meta.width, meta.height);
```

## Links

- [Original npm package](https://www.npmjs.com/package/video-metadata)

---

**Built with ❤️ for the Elide Polyglot Runtime**
