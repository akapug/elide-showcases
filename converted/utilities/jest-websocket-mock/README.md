# Jest WebSocket Mock - WebSocket Mocking for Jest

Mock WebSocket for Jest tests.

Based on [jest-websocket-mock](https://www.npmjs.com/package/jest-websocket-mock) (~50K+ downloads/week)

## Features

- ✅ Jest-compatible WebSocket mocking
- ✅ Message tracking
- ✅ Zero dependencies

## Quick Start

```typescript
import WS from './elide-jest-websocket-mock.ts';

const server = new WS('ws://localhost:8080');
server.send({ type: 'test' });
const message = await server.nextMessage();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
