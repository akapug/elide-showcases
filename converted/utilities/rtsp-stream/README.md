# RTSP Stream - Elide Polyglot Showcase

> **One RTSP server for ALL languages** - TypeScript, Python, Ruby, and Java

RTSP protocol server for video streaming.

## Features

- RTSP server
- RTP/RTCP support
- Multiple streams
- Authentication
- **~10K downloads/week on npm**

## Quick Start

```typescript
import RtspServer from './elide-rtsp-stream.ts';

const server = new RtspServer(8554);
server.addStream('/live/stream1', {});
server.start();
```

## Links

- [Original npm package](https://www.npmjs.com/package/rtsp-stream)

---

**Built with ❤️ for the Elide Polyglot Runtime**
