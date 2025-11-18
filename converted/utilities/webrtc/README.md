# WebRTC - Elide Polyglot Showcase

> **One WebRTC library for ALL languages** - TypeScript, Python, Ruby, and Java

WebRTC implementation for real-time communication.

## Features

- WebRTC peer connections
- Data channels
- Media streams
- ICE/STUN/TURN
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { RTCPeerConnection } from './elide-webrtc.ts';

const pc = new RTCPeerConnection();
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
```

## Links

- [Original npm package](https://www.npmjs.com/package/webrtc)

---

**Built with ❤️ for the Elide Polyglot Runtime**
