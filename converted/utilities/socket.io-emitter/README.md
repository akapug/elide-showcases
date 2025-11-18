# socket.io-emitter - Elide Polyglot Showcase

> **Emit Socket.IO events from any process for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Emit events from non-Socket.IO processes
- Redis-based event publishing
- Room and namespace targeting
- **~100K downloads/week on npm**

## Quick Start

```typescript
import createEmitter from './elide-socket.io-emitter.ts';

const emitter = createEmitter({ host: 'localhost', port: 6379 });
emitter.to('room1').emit('notification', { msg: 'Hello!' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/socket.io-emitter)

---

**Built with ❤️ for the Elide Polyglot Runtime**
