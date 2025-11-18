# Peer - Elide Polyglot Showcase

> **One P2P library for ALL languages** - TypeScript, Python, Ruby, and Java

Simple peer-to-peer connections with WebRTC.

## Features

- Simplified WebRTC API
- P2P connections
- Data channels
- Media streams
- **~100K downloads/week on npm**

## Quick Start

```typescript
import Peer from './elide-peer.ts';

const peer = new Peer();
peer.on('open', (id) => {
  const conn = peer.connect('other-peer');
  conn.send('Hello!');
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/peer)

---

**Built with ❤️ for the Elide Polyglot Runtime**
