# Mock Socket - WebSocket Mocking

Mock WebSocket connections for testing.

Based on [mock-socket](https://www.npmjs.com/package/mock-socket) (~100K+ downloads/week)

## Features

- ✅ Mock WebSocket connections
- ✅ Server simulation
- ✅ Zero dependencies

## Quick Start

```typescript
import { Server, WebSocket } from './elide-mock-socket.ts';

const server = new Server('ws://localhost:8080');
server.on('connection', socket => {
  socket.send('test');
});

const ws = new WebSocket('ws://localhost:8080');
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
