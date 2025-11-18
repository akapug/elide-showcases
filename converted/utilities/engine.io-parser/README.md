# engine.io-parser - Elide Polyglot Showcase

> **Engine.IO transport protocol for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Encode/decode Engine.IO packets
- Ping/pong heartbeat support
- Payload framing for multiple packets
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { encodePacket, decodePacket } from './elide-engine.io-parser.ts';

const packet = { type: 'message', data: { hello: 'world' } };
const encoded = encodePacket(packet);
const decoded = decodePacket(encoded.data as string);
```

## Links

- [Original npm package](https://www.npmjs.com/package/engine.io-parser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
