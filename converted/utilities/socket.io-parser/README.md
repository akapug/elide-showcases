# socket.io-parser - Elide Polyglot Showcase

> **Socket.IO protocol encoder/decoder for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Encode/decode Socket.IO packets
- Binary attachment support
- Event emission and acknowledgments
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { encode, decode, PacketType } from './elide-socket.io-parser.ts';

const packet = {
  type: PacketType.EVENT,
  nsp: '/',
  data: ['message', { text: 'Hello!' }]
};

const encoded = encode(packet);
const decoded = decode(encoded.packet);
```

## Links

- [Original npm package](https://www.npmjs.com/package/socket.io-parser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
