# Node Media Server - Elide Polyglot Showcase

> **One complete media server for ALL languages** - TypeScript, Python, Ruby, and Java

Full-featured media streaming server with RTMP, HLS, and more.

## Features

- RTMP/HTTP-FLV/WebSocket/HLS
- Live streaming
- Recording
- Transcoding
- **~80K downloads/week on npm**

## Quick Start

```typescript
import NodeMediaServer from './elide-node-media-server.ts';

const server = new NodeMediaServer({
  rtmp: { port: 1935 },
  http: { port: 8000 }
});
server.run();
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-media-server)

---

**Built with ❤️ for the Elide Polyglot Runtime**
