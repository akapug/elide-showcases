# Mediasoup - Elide Polyglot Showcase

> **One WebRTC SFU for ALL languages** - TypeScript, Python, Ruby, and Java

Cutting-edge WebRTC Selective Forwarding Unit for multi-party conferencing.

## Features

- WebRTC SFU architecture
- Multi-party video conferencing
- Simulcast and SVC
- Data channels
- Recording support
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { createWorker } from './elide-mediasoup.ts';

const worker = await createWorker();
const router = await worker.createRouter({
  mediaCodecs: [
    { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 }
  ]
});

const transport = await router.createWebRtcTransport({});
```

## Documentation

Run the demo:

```bash
elide run elide-mediasoup.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/mediasoup)
- [Mediasoup Documentation](https://mediasoup.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
