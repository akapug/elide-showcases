# Janus Gateway - Elide Polyglot Showcase

> **One Janus client for ALL languages** - TypeScript, Python, Ruby, and Java

Client library for Janus WebRTC Gateway.

## Features

- Janus Gateway client
- WebRTC signaling
- Plugin support
- SFU/MCU modes
- **~5K downloads/week on npm**

## Quick Start

```typescript
import Janus from './elide-janus-gateway.ts';

Janus.init({ debug: true });
const janus = new Janus({
  server: 'ws://localhost:8188',
  success: () => console.log('Connected')
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/janus-gateway)

---

**Built with ❤️ for the Elide Polyglot Runtime**
