# Real-Time Collaboration Platform

A production-ready collaborative editing platform built with TypeScript that enables multiple users to edit documents simultaneously with conflict resolution, real-time presence awareness, and complete version history.

## Features

### ⚙️ Operational Transform (OT)
- Automatic conflict resolution for concurrent edits
- Transform operations against each other to maintain consistency
- Support for insert, delete, and retain operations
- Deterministic transformation with tie-breaking
- Composition of multiple operations

### 🔄 Conflict Resolution
- Automatic merge of conflicting changes
- Position-based transformation
- Overlapping delete handling
- User ID-based tie-breaking for simultaneous edits
- No lost updates guarantee

### 👥 Presence Awareness
- Real-time cursor positions
- Text selection tracking
- User color coding
- Active collaborator list
- Stale presence cleanup (30s timeout)
- Cursor following capabilities

### 📜 Version History
- Complete operation log
- Point-in-time snapshots (every 10 versions)
- Diff generation between versions
- Restore to any previous version
- Per-user attribution
- Timestamp tracking

### 💾 Document Persistence
- In-memory storage (extensible to database)
- Auto-save on every change
- Pending operations buffer
- Efficient revision storage
- Snapshot-based restoration

### 🔌 WebSocket Communication
- Real-time bidirectional communication
- Automatic reconnection handling
- Message acknowledgment
- Broadcast to active collaborators
- Session management

## Architecture

```
┌─────────────────────────────────────────┐
│           Client Editors                 │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │ Ed1 │  │ Ed2 │  │ Ed3 │  │ Ed4 │   │
│  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘   │
└─────┼────────┼────────┼────────┼────────┘
      │        │        │        │
      └────────┴────────┴────────┘
                 │
            WebSocket
                 │
      ┌──────────▼──────────┐
      │  Session Manager    │
      └──────────┬──────────┘
                 │
      ┌──────────┼──────────┐
      │          │           │
┌─────▼─────┐ ┌─▼──────┐ ┌─▼────────┐
│ Document  │ │Presence│ │    OT    │
│ Manager   │ │Manager │ │  Engine  │
└───────────┘ └────────┘ └──────────┘
```

## API Reference

### HTTP Endpoints

#### Create Document
```http
POST /documents
Content-Type: application/json

{
  "title": "My Document",
  "userId": "user123"
}

Response:
{
  "id": "doc-uuid",
  "title": "My Document",
  "content": "",
  "version": 0,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "createdBy": "user123",
  "collaborators": ["user123"]
}
```

#### Get Document
```http
GET /documents/:documentId

Response:
{
  "id": "doc-uuid",
  "title": "My Document",
  "content": "Document content...",
  "version": 42,
  ...
}
```

#### Get Revision History
```http
GET /documents/:documentId/revisions?limit=50

Response:
[
  {
    "id": "rev-uuid",
    "documentId": "doc-uuid",
    "version": 42,
    "operations": [...],
    "userId": "user123",
    "timestamp": "2025-01-01T00:00:00Z"
  }
]
```

#### Restore Version
```http
POST /documents/:documentId/restore
Content-Type: application/json

{
  "documentId": "doc-uuid",
  "version": 35
}

Response:
{
  "success": true
}
```

### WebSocket Protocol

#### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/?documentId=doc-uuid&userId=user123');
```

#### Message Types

**Initialize (Server → Client)**
```json
{
  "type": "init",
  "payload": {
    "document": { "id": "...", "content": "...", "version": 5 },
    "presence": [
      { "userId": "user2", "cursor": { "line": 10, "column": 5 } }
    ]
  }
}
```

**Operation (Client → Server)**
```json
{
  "type": "operation",
  "payload": {
    "type": "insert",
    "position": 42,
    "content": "Hello"
  }
}
```

**Operation Broadcast (Server → Clients)**
```json
{
  "type": "operation",
  "payload": {
    "operation": {
      "type": "insert",
      "position": 42,
      "content": "Hello",
      "userId": "user123",
      "timestamp": "2025-01-01T00:00:00Z"
    },
    "version": 6
  }
}
```

**Presence Update (Client → Server)**
```json
{
  "type": "presence",
  "payload": {
    "cursor": { "line": 10, "column": 5 },
    "selection": {
      "start": { "line": 10, "column": 5 },
      "end": { "line": 10, "column": 20 }
    }
  }
}
```

**Cursor Update (Client → Server)**
```json
{
  "type": "cursor",
  "payload": {
    "line": 10,
    "column": 5
  }
}
```

## Usage

### Installation
```bash
npm install
npm install ws @types/ws
```

### Running the Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Client Integration

#### Basic Editor Setup
```typescript
import { WebSocket } from 'ws';

class CollaborativeEditor {
  private ws: WebSocket;
  private documentId: string;
  private userId: string;
  private version: number = 0;

  constructor(documentId: string, userId: string) {
    this.documentId = documentId;
    this.userId = userId;
    this.connectWebSocket();
  }

  private connectWebSocket() {
    this.ws = new WebSocket(
      `ws://localhost:3001/?documentId=${this.documentId}&userId=${this.userId}`
    );

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'init':
        this.version = message.payload.document.version;
        this.renderDocument(message.payload.document.content);
        this.renderPresence(message.payload.presence);
        break;

      case 'operation':
        this.applyRemoteOperation(message.payload.operation);
        this.version = message.payload.version;
        break;

      case 'presence':
        this.updateUserPresence(message.payload);
        break;

      case 'cursor':
        this.updateUserCursor(message.payload);
        break;
    }
  }

  sendOperation(type: string, position: number, content?: string, length?: number) {
    this.ws.send(JSON.stringify({
      type: 'operation',
      payload: { type, position, content, length }
    }));
  }

  sendCursorUpdate(line: number, column: number) {
    this.ws.send(JSON.stringify({
      type: 'cursor',
      payload: { line, column }
    }));
  }

  private applyRemoteOperation(operation: any) {
    // Apply the operation to your editor's content
    console.log('Applying operation:', operation);
  }

  private renderDocument(content: string) {
    // Render the document content in your editor
    console.log('Rendering document:', content);
  }

  private renderPresence(presence: any[]) {
    // Show other users' cursors and selections
    console.log('Active collaborators:', presence);
  }

  private updateUserPresence(presence: any) {
    // Update a specific user's presence
    console.log('User presence updated:', presence);
  }

  private updateUserCursor(cursor: any) {
    // Update a specific user's cursor position
    console.log('User cursor updated:', cursor);
  }
}

// Usage
const editor = new CollaborativeEditor('doc-uuid', 'user123');
```

#### Handling Text Edits
```typescript
// When user types
editor.sendOperation('insert', cursorPosition, 'Hello');

// When user deletes
editor.sendOperation('delete', cursorPosition, undefined, 5);

// When cursor moves
editor.sendCursorUpdate(lineNumber, columnNumber);
```

## Operational Transform Examples

### Example 1: Concurrent Inserts
```
Initial: "Hello"
         ^
         position 0

User A: Insert "X" at position 0 → "XHello"
User B: Insert "Y" at position 0 → "YHello"

After OT:
User A sees: "XYHello"
User B sees: "XYHello"
```

### Example 2: Insert and Delete
```
Initial: "Hello World"
          ^     ^
          5     10

User A: Insert " Beautiful" at position 5
User B: Delete 6 chars from position 5 (delete " World")

After OT:
Result: "Hello Beautiful"
```

### Example 3: Overlapping Deletes
```
Initial: "Hello World"
          ^^^^^
          0-5

User A: Delete 5 chars from position 0 (delete "Hello")
User B: Delete 3 chars from position 2 (delete "llo")

After OT:
Result: " World" (only non-overlapping parts deleted)
```

## Configuration

### Environment Variables
```env
PORT=3001
PRESENCE_TIMEOUT=30000
MAX_PENDING_OPERATIONS=100
SNAPSHOT_INTERVAL=10
WEBSOCKET_PING_INTERVAL=30000
```

### Customization
```typescript
class DocumentManager {
  // Adjust snapshot frequency
  private snapshotInterval = 10; // Every N versions

  // Adjust pending operations buffer
  private maxPendingOps = 100;
}

class PresenceManager {
  // Adjust presence timeout
  private readonly presenceTimeout = 30000; // 30 seconds
}
```

## Production Deployment

### Database Integration
Replace in-memory storage with PostgreSQL:

```typescript
// Store documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  version INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID
);

// Store revisions
CREATE TABLE revisions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  version INTEGER,
  operations JSONB,
  user_id UUID,
  timestamp TIMESTAMP,
  snapshot TEXT
);

// Store presence
CREATE TABLE presence (
  user_id UUID,
  document_id UUID,
  cursor JSONB,
  selection JSONB,
  last_seen TIMESTAMP,
  PRIMARY KEY (user_id, document_id)
);
```

### Redis for Presence
Use Redis for real-time presence data:

```typescript
// Store presence with TTL
await redis.setex(
  `presence:${documentId}:${userId}`,
  30,
  JSON.stringify(presence)
);

// Get all presence for document
const keys = await redis.keys(`presence:${documentId}:*`);
const presence = await Promise.all(keys.map(k => redis.get(k)));
```

### Scaling Considerations

1. **Horizontal Scaling**: Use Redis Pub/Sub for WebSocket synchronization
2. **Load Balancing**: Sticky sessions for WebSocket connections
3. **Database**: Connection pooling with pg-pool
4. **Caching**: Redis for document metadata
5. **Message Queue**: Bull for operation processing

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Kubernetes Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: collaboration-server
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: server
        image: collaboration-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: REDIS_URL
          value: redis://redis-service:6379
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
---
apiVersion: v1
kind: Service
metadata:
  name: collaboration-service
spec:
  type: LoadBalancer
  sessionAffinity: ClientIP
  ports:
  - port: 3001
    targetPort: 3001
```

## Performance Optimization

### Tips
1. **Batch Operations**: Group rapid operations together
2. **Compression**: Use permessage-deflate for WebSocket
3. **Delta Sync**: Send only changed parts
4. **Lazy Loading**: Load revisions on demand
5. **Debounce**: Throttle presence updates

### Monitoring
- Operation throughput
- Transformation latency
- Active sessions count
- Document version rate
- WebSocket connection health

## Security

### Recommendations
1. **Authentication**: Validate JWT tokens on WebSocket connection
2. **Authorization**: Check document access permissions
3. **Rate Limiting**: Prevent operation flooding
4. **Input Validation**: Sanitize operation content
5. **XSS Protection**: Escape user-generated content
6. **Audit Log**: Track all document changes

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support@example.com.
