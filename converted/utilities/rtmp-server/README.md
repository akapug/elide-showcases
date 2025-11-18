# RTMP Server - Elide Polyglot Showcase

> **One RTMP server for ALL languages** - TypeScript, Python, Ruby, and Java

RTMP server for real-time live streaming.

## Features

- RTMP server
- Live streaming
- Stream publishing/playback
- Authentication
- **~15K downloads/week on npm**

## Quick Start

```typescript
import RTMPServer from './elide-rtmp-server.ts';

const server = new RTMPServer(1935);
server.on('publish', () => console.log('Stream live!'));
server.start();
```

## Links

- [Original npm package](https://www.npmjs.com/package/rtmp-server)

---

**Built with ❤️ for the Elide Polyglot Runtime**
