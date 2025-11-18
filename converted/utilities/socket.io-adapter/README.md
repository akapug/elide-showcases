# socket.io-adapter - Elide Polyglot Showcase

> **Socket.IO room management for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Room management (join/leave)
- Event broadcasting to rooms
- Client tracking
- **~2M downloads/week on npm**

## Quick Start

```typescript
import Adapter from './elide-socket.io-adapter.ts';

const adapter = new Adapter(nsp);
adapter.addAll('socket1', new Set(['room1']));
adapter.broadcast({ event: 'message' }, { rooms: new Set(['room1']) });
```

## Links

- [Original npm package](https://www.npmjs.com/package/socket.io-adapter)

---

**Built with ❤️ for the Elide Polyglot Runtime**
