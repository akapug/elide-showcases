# WRTC - Elide Polyglot Showcase

> **One native WebRTC for ALL languages** - TypeScript, Python, Ruby, and Java

Native WebRTC implementation for Node.js.

## Features

- Native WebRTC
- RTCPeerConnection
- RTCDataChannel
- Media streams
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { RTCPeerConnection } from './elide-wrtc.ts';

const pc = new RTCPeerConnection();
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
```

## Links

- [Original npm package](https://www.npmjs.com/package/wrtc)

---

**Built with ❤️ for the Elide Polyglot Runtime**
