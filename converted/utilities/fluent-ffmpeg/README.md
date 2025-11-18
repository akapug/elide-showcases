# fluent-ffmpeg - Elide Polyglot Showcase

> **FFmpeg wrapper for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Video transcoding and conversion
- Audio extraction and encoding
- Video filtering and effects
- Thumbnail generation
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import ffmpeg from './elide-fluent-ffmpeg.ts';

ffmpeg('input.mp4')
  .videoCodec('libx264')
  .audioCodec('aac')
  .size('1280x720')
  .output('output.mp4')
  .run();
```

## Links

- [Original npm package](https://www.npmjs.com/package/fluent-ffmpeg)

---

**Built with ❤️ for the Elide Polyglot Runtime**
