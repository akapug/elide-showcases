# Node RTSP Stream - Elide Polyglot Showcase

> **One RTSP streamer for ALL languages** - TypeScript, Python, Ruby, and Java

Stream RTSP video over WebSocket using FFmpeg.

## Features

- RTSP to WebSocket
- IP camera support
- Real-time video
- Low latency
- **~20K downloads/week on npm**

## Quick Start

```typescript
import Stream from './elide-node-rtsp-stream.ts';

const stream = new Stream({
  name: 'Camera',
  streamUrl: 'rtsp://192.168.1.100:554/stream',
  wsPort: 9999
});
stream.start();
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-rtsp-stream)

---

**Built with ❤️ for the Elide Polyglot Runtime**
