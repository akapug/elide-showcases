# Scalable WebSocket Server

A production-ready WebSocket server implementation with connection pooling, pub/sub messaging, room management, and presence tracking for real-time applications.

## Features

- **Connection Pooling**: Efficient connection management with configurable limits
- **Pub/Sub Messaging**: Event-driven messaging system
- **Room Management**: Group-based messaging with automatic cleanup
- **Presence Tracking**: Real-time user status tracking
- **Message Broadcasting**: One-to-many message distribution
- **Heartbeat/Ping-Pong**: Connection health monitoring
- **Auto-Cleanup**: Automatic cleanup of idle connections and rooms

## Architecture

```
┌──────────────┐
│   Clients    │
└──────┬───────┘
       │ WebSocket
       ▼
┌──────────────────────┐
│  Connection Pool     │
│  - 10k connections   │
│  - Heartbeat         │
│  - Cleanup           │
└──────┬───────────────┘
       │
   ┌───┴────┬──────────┬────────────┐
   ▼        ▼          ▼            ▼
┌──────┐ ┌─────┐  ┌─────────┐  ┌─────────┐
│Rooms │ │Pub/ │  │Presence │  │Broadcast│
│      │ │ Sub │  │Tracker  │  │         │
└──────┘ └─────┘  └─────────┘  └─────────┘
```

## Message Protocol

### Message Format

```typescript
interface WSMessage {
  type: MessageType;
  payload: any;
  room?: string;
  userId?: string;
  timestamp?: number;
}
```

### Message Types

- `connect`: Connection established
- `disconnect`: Connection closed
- `join_room`: Join a room
- `leave_room`: Leave a room
- `message`: Send a message
- `broadcast`: Broadcast to all
- `presence`: Presence update
- `ping`/`pong`: Heartbeat

## Connection Management

### Connection Pool

```typescript
const pool = new ConnectionPool(10000); // Max 10k connections

// Add connection
pool.add(connection);

// Get connection
const conn = pool.get(connectionId);

// Get by user
const userConns = pool.getByUserId(userId);

// Get by room
const roomConns = pool.getByRoom(roomId);

// Cleanup idle connections
pool.cleanup(300000); // 5 minutes
```

### Connection Limits

```typescript
// Configure max connections
const server = new WebSocketServer({
  maxConnections: 10000,
  heartbeatInterval: 30000,  // 30 seconds
  cleanupInterval: 60000     // 1 minute
});
```

## Room System

### Creating/Joining Rooms

```typescript
// Client joins room
ws.send(JSON.stringify({
  type: 'join_room',
  payload: {
    room: 'general'
  }
}));

// Server creates room automatically
const room = roomManager.getOrCreate('general');
```

### Room Messages

```typescript
// Send message to room
ws.send(JSON.stringify({
  type: 'message',
  payload: {
    room: 'general',
    content: 'Hello, room!'
  }
}));

// Broadcast to room (server-side)
broadcastToRoom('general', {
  type: 'message',
  payload: { content: 'Server announcement' }
});
```

### Auto-Cleanup

Rooms are automatically deleted when the last member leaves:

```typescript
// When last user leaves
if (room.connections.size === 0) {
  roomManager.delete(roomId);
}
```

## Pub/Sub System

### Subscribe to Channels

```typescript
const pubsub = new PubSub();

// Subscribe
const unsubscribe = pubsub.subscribe('user:123', (message) => {
  console.log('Received:', message);
});

// Publish
pubsub.publish('user:123', { action: 'update' });

// Unsubscribe
unsubscribe();
```

### Channel Patterns

```typescript
// User-specific channels
pubsub.subscribe('user:123', handler);

// Room channels
pubsub.subscribe('room:general', handler);

// Broadcast channels
pubsub.subscribe('broadcast:all', handler);

// Event channels
pubsub.subscribe('event:login', handler);
```

## Presence Tracking

### Set Presence

```typescript
// Client updates presence
ws.send(JSON.stringify({
  type: 'presence',
  payload: {
    status: 'online',  // 'online' | 'away' | 'offline'
    metadata: {
      activity: 'typing'
    }
  }
}));
```

### Track Presence

```typescript
// Get user presence
const presence = presenceTracker.getPresence(userId);

// Get all online users
const online = presenceTracker.getOnlineUsers();

// Subscribe to presence updates
presenceTracker.onUpdate((presence) => {
  console.log(`${presence.userId} is now ${presence.status}`);
});
```

### Auto-Update

Presence is automatically updated on:
- Connection: `online`
- Disconnect: `offline`
- Idle timeout: `away`

## Heartbeat System

### Ping/Pong

Server sends ping every 30 seconds:

```typescript
// Server sends ping
{
  type: 'ping',
  payload: { timestamp: 1234567890 }
}

// Client responds with pong
ws.send(JSON.stringify({
  type: 'pong',
  payload: { timestamp: Date.now() }
}));
```

### Connection Health

```typescript
// Mark connection as alive on pong
connection.isAlive = true;

// Close dead connections
if (!connection.isAlive) {
  connection.socket.close();
}
```

## Broadcasting

### Broadcast to All

```typescript
// Client broadcasts
ws.send(JSON.stringify({
  type: 'broadcast',
  payload: {
    content: 'Important announcement'
  }
}));

// Server broadcasts
broadcast({
  type: 'broadcast',
  payload: { content: 'System message' }
});
```

### Broadcast to Room

```typescript
broadcastToRoom('general', message, excludeConnectionId);
```

### Send to User

```typescript
// Send to all user's connections
sendToUser(userId, message);
```

## Client Usage

### Connect to Server

```javascript
const ws = new WebSocket('ws://localhost:3000?userId=user123');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('Error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Join Room

```javascript
ws.send(JSON.stringify({
  type: 'join_room',
  payload: { room: 'general' }
}));
```

### Send Message

```javascript
ws.send(JSON.stringify({
  type: 'message',
  payload: {
    room: 'general',
    content: 'Hello, world!'
  }
}));
```

### Update Presence

```javascript
ws.send(JSON.stringify({
  type: 'presence',
  payload: {
    status: 'online',
    metadata: { activity: 'active' }
  }
}));
```

## Scaling

### Horizontal Scaling

Use Redis for cross-server communication:

```typescript
class RedisAdapter {
  constructor(private redis: RedisClient) {}

  async publish(channel: string, message: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, handler: Function): Promise<void> {
    await this.redis.subscribe(channel, (message) => {
      handler(JSON.parse(message));
    });
  }
}
```

### Load Balancing

```nginx
upstream websocket {
    ip_hash;  # Sticky sessions
    server ws1.example.com:3000;
    server ws2.example.com:3000;
    server ws3.example.com:3000;
}

server {
    location /ws {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Connection Limits

```typescript
// Per-server limits
const MAX_CONNECTIONS = 10000;

// Per-user limits
const MAX_CONNECTIONS_PER_USER = 5;

// Rate limiting
const MESSAGES_PER_SECOND = 10;
```

## Monitoring

### Server Stats

```bash
curl http://localhost:3000/stats
```

Response:
```json
{
  "connections": 1234,
  "rooms": 56,
  "onlineUsers": 890,
  "channels": 12
}
```

### Metrics to Track

- **Connections**: Active connections count
- **Messages/sec**: Message throughput
- **Latency**: Message delivery latency
- **Room count**: Active rooms
- **Memory usage**: Memory per connection
- **Error rate**: Connection errors

### Logging

```typescript
// Connection events
console.log(`Connection: ${connectionId} (user: ${userId})`);
console.log(`Disconnect: ${connectionId}`);

// Room events
console.log(`Join room: ${roomId} (${connectionId})`);
console.log(`Leave room: ${roomId} (${connectionId})`);

// Presence events
console.log(`Presence: ${userId} is ${status}`);

// Cleanup events
console.log(`Cleaned up ${count} idle connections`);
```

## Error Handling

### Connection Errors

```typescript
socket.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
  // Cleanup connection
  handleDisconnect(connection);
});
```

### Message Errors

```typescript
try {
  const message = JSON.parse(data);
  handleMessage(connection, message);
} catch (error) {
  sendError(connection, 'Invalid message format');
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private limits: Map<string, number[]> = new Map();

  check(userId: string, limit: number, window: number): boolean {
    const now = Date.now();
    const timestamps = this.limits.get(userId) || [];

    // Remove old timestamps
    const recent = timestamps.filter(t => now - t < window);

    if (recent.length >= limit) {
      return false;
    }

    recent.push(now);
    this.limits.set(userId, recent);
    return true;
  }
}
```

## Security

### Authentication

```typescript
// Verify token on connection
const token = url.searchParams.get('token');
const user = await verifyToken(token);

if (!user) {
  socket.close(1008, 'Unauthorized');
  return;
}
```

### Message Validation

```typescript
function validateMessage(message: WSMessage): boolean {
  // Validate message type
  if (!Object.values(MessageType).includes(message.type)) {
    return false;
  }

  // Validate payload
  if (!message.payload || typeof message.payload !== 'object') {
    return false;
  }

  // Validate content length
  if (message.payload.content?.length > 10000) {
    return false;
  }

  return true;
}
```

### Rate Limiting

```typescript
const rateLimiter = new RateLimiter();

if (!rateLimiter.check(userId, 10, 1000)) {
  sendError(connection, 'Rate limit exceeded');
  return;
}
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["elide", "run", "server.ts"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: websocket-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: websocket
  template:
    metadata:
      labels:
        app: websocket
    spec:
      containers:
      - name: websocket
        image: websocket-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: MAX_CONNECTIONS
          value: "10000"
---
apiVersion: v1
kind: Service
metadata:
  name: websocket-service
spec:
  type: LoadBalancer
  sessionAffinity: ClientIP
  ports:
  - port: 3000
    targetPort: 3000
  selector:
    app: websocket
```

## Running the Server

```bash
# Start server
elide run server.ts

# Server runs on http://localhost:3000
# WebSocket endpoint: ws://localhost:3000
```

## Testing

```bash
# Test connection
wscat -c ws://localhost:3000?userId=test

# Join room
> {"type":"join_room","payload":{"room":"general"}}

# Send message
> {"type":"message","payload":{"room":"general","content":"Hello"}}

# Check stats
curl http://localhost:3000/stats
```

## Best Practices

1. **Implement Heartbeat**: Always use ping/pong for connection health
2. **Rate Limiting**: Limit messages per user per second
3. **Auto-Cleanup**: Clean up idle connections and empty rooms
4. **Validate Messages**: Validate all incoming messages
5. **Handle Reconnection**: Implement client-side reconnection logic
6. **Use Binary for Large Data**: Use binary frames for large payloads
7. **Monitor Metrics**: Track connections, messages, and errors
8. **Implement Backpressure**: Handle slow consumers gracefully

## Performance Tips

- Use connection pooling
- Implement message batching
- Use binary frames for efficiency
- Enable compression for large messages
- Limit message size
- Use Redis for multi-server deployments
- Implement horizontal scaling with sticky sessions

## Further Reading

- [WebSocket Protocol (RFC 6455)](https://tools.ietf.org/html/rfc6455)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Scaling WebSocket](https://www.ably.io/topic/websockets-scaling)
