# Node TURN - Elide Polyglot Showcase

> **One TURN server for ALL languages** - TypeScript, Python, Ruby, and Java

TURN server implementation for WebRTC NAT traversal.

## Features

- TURN server
- STUN support
- NAT traversal
- UDP/TCP relay
- Authentication
- **~5K downloads/week on npm**

## Quick Start

```typescript
import TurnServer from './elide-node-turn.ts';

const server = new TurnServer({
  listeningPort: 3478,
  authMech: 'long-term'
});
server.start();
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-turn)

---

**Built with ❤️ for the Elide Polyglot Runtime**
