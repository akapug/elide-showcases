# Video Thumbnail - Elide Polyglot Showcase

> **One thumbnail generator for ALL languages** - TypeScript, Python, Ruby, and Java

Generate thumbnails from video files.

## Features

- Video thumbnail generation
- Multiple thumbnails
- Custom dimensions
- Time-based extraction
- **~50K downloads/week on npm**

## Quick Start

```typescript
import generate from './elide-video-thumbnail.ts';

const thumbs = await generate('video.mp4', {
  timestamps: ['00:00:01', '00:00:05'],
  size: '640x360'
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/video-thumbnail)

---

**Built with ❤️ for the Elide Polyglot Runtime**
