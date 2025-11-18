# MediaSource - Elide Polyglot Showcase

> **One MSE implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Media Source Extensions API for adaptive streaming.

## Features

- Media Source Extensions
- Adaptive streaming
- Buffer management
- Source buffer control
- **~10K downloads/week on npm**

## Quick Start

```typescript
import MediaSource from './elide-mediasource.ts';

const ms = new MediaSource();
const buffer = ms.addSourceBuffer('video/mp4');
buffer.appendBuffer(videoData);
```

## Links

- [Original npm package](https://www.npmjs.com/package/mediasource)

---

**Built with ❤️ for the Elide Polyglot Runtime**
