# Get Video Duration - Elide Polyglot Showcase

> **One video duration extractor for ALL languages** - TypeScript, Python, Ruby, and Java

Extract video duration from files without spawning ffmpeg.

## Features

- Fast duration extraction
- Multiple format support
- No external dependencies
- Async/sync APIs
- Duration formatting
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { getVideoDurationInSeconds, formatDuration } from './elide-get-video-duration.ts';

const duration = await getVideoDurationInSeconds('video.mp4');
console.log(formatDuration(duration)); // "2:05"
```

## Documentation

Run the demo:

```bash
elide run elide-get-video-duration.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/get-video-duration)

---

**Built with ❤️ for the Elide Polyglot Runtime**
