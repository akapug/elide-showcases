# Simple Peer - Elide Polyglot Showcase

> **One WebRTC library for ALL languages** - TypeScript, Python, Ruby, and Java

Simple WebRTC video, voice and data channels for peer connections.

## Features

- WebRTC peer connections
- Video/voice calls
- Data channels
- STUN/TURN support
- Simplified API
- **~200K downloads/week on npm**

## Quick Start

```typescript
import SimplePeer from './elide-simple-peer.ts';

const peer = new SimplePeer({ initiator: true });

peer.on('signal', data => {
  // Send signal to remote peer
});

peer.on('connect', () => {
  peer.send('Hello!');
});
```

## Documentation

Run the demo:

```bash
elide run elide-simple-peer.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/simple-peer)
- [WebRTC Documentation](https://webrtc.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
