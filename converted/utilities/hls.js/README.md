# HLS.js - Elide Polyglot Showcase

> **One HLS streaming library for ALL languages** - TypeScript, Python, Ruby, and Java

JavaScript HLS client using Media Source Extension for adaptive streaming.

## Features

- HLS playback in browser
- Adaptive bitrate streaming
- Live and VOD support
- Quality level switching
- Fragment loading
- **~400K downloads/week on npm**

## Quick Start

```typescript
import Hls from './elide-hls.js.ts';

if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource('stream.m3u8');
  hls.attachMedia(videoElement);

  // Switch quality
  hls.setLevel(2); // 1080p
}
```

## Documentation

Run the demo:

```bash
elide run elide-hls.js.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/hls.js)
- [HLS.js Documentation](https://github.com/video-dev/hls.js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
