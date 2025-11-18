# FFmpeg Static - Elide Polyglot Showcase

> **One FFmpeg wrapper for ALL languages** - TypeScript, Python, Ruby, and Java

Static FFmpeg binaries for video processing with cross-platform support.

## Features

- Static FFmpeg binary paths
- Video encoding/decoding
- Format conversion
- Thumbnail generation
- Audio extraction
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import ffmpeg from './elide-ffmpeg-static.ts';

// Get binary path
console.log(ffmpeg.getBinaryPath());

// Convert video
await ffmpeg.convert('input.mp4', 'output.webm', {
  codec: 'libvpx',
  bitrate: '1M'
});

// Get metadata
const meta = await ffmpeg.getMetadata('video.mp4');
console.log(meta.duration, 'seconds');
```

## Documentation

Run the demo:

```bash
elide run elide-ffmpeg-static.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/ffmpeg-static)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

---

**Built with ❤️ for the Elide Polyglot Runtime**
