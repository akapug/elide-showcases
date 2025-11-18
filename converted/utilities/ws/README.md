# WS - Simple WebSocket Client and Server - Elide Polyglot Showcase

> **One WebSocket library for ALL languages** - TypeScript, Python, Ruby, and Java

Fast, simple WebSocket implementation for client and server across your entire polyglot stack.

## 🌟 Why This Matters

Different languages use different WebSocket libraries:
- websockets in Python has different API
- faye-websocket in Ruby uses different patterns
- Java-WebSocket is verbose and complex
- Each has different message handling

**Elide solves this** with ONE WebSocket library that works in ALL languages.

## ✨ Features

- ✅ WebSocket client and server
- ✅ Ping/pong heartbeats
- ✅ Binary and text frames
- ✅ Message fragmentation
- ✅ Event-based API
- ✅ Low-level control
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import WebSocket from './elide-ws.ts';

// Client
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  ws.send('Hello Server!');
});

ws.on('message', (data) => {
  console.log('Received:', data);
});

// Server
import { WebSocketServer } from './elide-ws.ts';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket) => {
  socket.on('message', (data) => {
    socket.send(data); // Echo
  });
});
```

### Python
```python
from elide import require
WebSocket = require('./elide-ws.ts').default

ws = WebSocket('ws://localhost:8080')

def on_open():
    ws.send('Hello Server!')

def on_message(data):
    print('Received:', data)

ws.on('open', on_open)
ws.on('message', on_message)
```

## 💡 Real-World Use Cases

### Real-time Data Stream
```typescript
const ws = new WebSocket('wss://api.example.com/stream');

ws.on('open', () => {
  ws.send(JSON.stringify({ subscribe: 'prices' }));
});

ws.on('message', (data) => {
  const update = JSON.parse(data.toString());
  console.log('Price update:', update);
});
```

### Broadcasting Server
```typescript
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket) => {
  socket.on('message', (data) => {
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});
```

## 📖 API Reference

### `new WebSocket(address, protocols?, options?)`
Create WebSocket client

### `new WebSocketServer(options)`
Create WebSocket server

### `ws.send(data, callback?)`
Send data

### `ws.ping(data?, mask?, callback?)`
Send ping frame

### `ws.close(code?, reason?)`
Close connection

## 🧪 Testing

```bash
elide run elide-ws.ts
```

## 📝 Package Stats

- **npm downloads**: ~120M/week
- **Use case**: WebSocket client/server
- **Elide advantage**: One WebSocket library for all languages
- **Polyglot score**: 48/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
