# ElideDB Architecture

## Overview

ElideDB is built with a layered architecture that prioritizes local-first functionality while enabling seamless multi-device synchronization.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                    │
│              (Your app using ElideDB)                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     Client API Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ ElideDB API  │  │QueryBuilder  │  │Subscription │  │
│  │ (CRUD ops)   │  │(SQL-like API)│  │Manager      │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      Core Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Sync Engine  │  │  Conflict    │  │   Local DB  │  │
│  │ (WebSocket)  │  │  Resolution  │  │   Adapter   │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Storage Layer                         │
│        ┌──────────────┐      ┌──────────────┐          │
│        │  IndexedDB   │  or  │   SQLite     │          │
│        │  (Browser)   │      │   (Node.js)  │          │
│        └──────────────┘      └──────────────┘          │
└─────────────────────────────────────────────────────────┘

                     ↕ WebSocket Sync ↕

┌─────────────────────────────────────────────────────────┐
│                     Sync Server                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │WebSocket Srv │  │     Auth     │  │   Server    │  │
│  │(Connection)  │  │  (Optional)  │  │   Storage   │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Client API (`client/client-api.ts`)

The main entry point for applications. Provides:

- Database initialization
- CRUD operations (Create, Read, Update, Delete)
- Transaction support
- Schema validation
- Export/import functionality

**Key Methods:**
- `init()`: Initialize database with schema
- `insert()`: Create new documents
- `update()`: Modify existing documents
- `delete()`: Remove documents
- `query()`: Execute queries
- `table()`: Get query builder
- `sync()`: Force synchronization

### 2. Query Builder (`client/query-builder.ts`)

SQL-like fluent API for building queries.

**Features:**
- Chainable API: `db.table('users').where('age', '>', 18).orderBy('name').get()`
- SQL operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `IN`, `LIKE`
- Aggregations: `sum()`, `avg()`, `count()`, `min()`, `max()`
- Pagination: `limit()`, `offset()`, `paginate()`
- Real-time: `subscribe()` for live updates

**Example:**
```typescript
const activeUsers = await db.table('users')
  .where('status', 'active')
  .whereGreaterThan('lastLogin', Date.now() - 86400000)
  .orderBy('name', 'ASC')
  .limit(10)
  .get();
```

### 3. Local Storage (`core/local-db.ts`)

Abstraction over browser and Node.js storage.

**Browser (IndexedDB):**
- Object stores for each table
- Indexes on `_timestamp`, `_version`, `_clientId`
- Change log for sync
- Metadata store

**Node.js (SQLite via better-sqlite3):**
- Table per collection
- JSON column for document data
- Full-text search support
- Transactions and WAL mode

**Both implementations provide:**
- `get()`: Retrieve single document
- `getAll()`: Retrieve all documents in table
- `query()`: Execute complex queries
- `put()`: Insert or update document
- `delete()`: Soft-delete document
- `getChanges()`: Get changes since timestamp
- `applyChanges()`: Apply changes from sync

### 4. Sync Engine (`core/sync-engine.ts`)

Handles bidirectional synchronization.

**Protocol:**
1. **Connect**: WebSocket connection to server
2. **Push**: Send local changes to server
3. **Pull**: Receive remote changes from server
4. **Resolve**: Handle conflicts using vector clocks
5. **Repeat**: Periodic sync (configurable interval)

**Message Types:**
- `push`: Client sending changes to server
- `pull`: Client requesting changes from server
- `sync`: Server sending changes to client
- `ack`: Acknowledgment of received changes

**Vector Clocks:**
Each client maintains a vector clock tracking versions:
```typescript
{
  'client-1': 5,
  'client-2': 3,
  'server': 10
}
```

Conflicts are detected when:
```typescript
change1.version > vectorClock[change2.clientId] &&
change2.version > vectorClock[change1.clientId]
```

### 5. Conflict Resolution (`core/conflict-resolver.ts`)

Handles concurrent modifications.

**Strategies:**

1. **Last-Write-Wins (LWW)**
   - Default strategy
   - Uses timestamp to determine winner
   - Simple and predictable

2. **First-Write-Wins (FWW)**
   - Earlier change wins
   - Useful for immutable data

3. **Custom**
   - User-defined resolution logic
   - Full control over merging

**CRDT Support:**
- Counters: Increment-only, eventually consistent
- Sets: OR-Set (add/remove with tombstones)
- Maps: Per-key last-write-wins
- Text: LCS-based merging (use Yjs/Automerge for production)

**Example:**
```typescript
const resolver = new ConflictResolver('CUSTOM', (local, remote) => {
  // Merge both changes
  return {
    ...local,
    data: {
      ...local.data,
      ...remote.data,
      // Custom merge logic
      tags: [...new Set([...local.data.tags, ...remote.data.tags])],
      views: local.data.views + remote.data.views
    }
  };
});
```

### 6. Subscription Manager (`client/subscriptions.ts`)

Real-time updates for query results.

**How it works:**
1. Client subscribes to a query
2. Manager polls storage for changes (configurable interval)
3. Compares new results with cached results
4. Notifies callback only if results changed

**Optimization:**
- Batch multiple subscriptions together
- Only notify when data actually changes
- Track by table for efficient invalidation

**Example:**
```typescript
const sub = db.table('messages')
  .where('room', 'general')
  .subscribe((messages) => {
    // Called when messages change
    updateUI(messages);
  });

// Later
sub.unsubscribe();
```

### 7. Sync Server (`server/sync-server.ts`)

WebSocket server for multi-client synchronization.

**Features:**
- WebSocket connections (ws library)
- Per-client state tracking
- Heartbeat for connection health
- Broadcast changes to all clients
- Optional authentication

**Server State:**
```typescript
interface ConnectedClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  vectorClock: VectorClock;
  lastSyncTime: Timestamp;
  alive: boolean;
}
```

**Message Flow:**
```
Client A                Server               Client B
   |                       |                    |
   |----[push changes]---->|                    |
   |<------[ack]-----------|                    |
   |                       |----[broadcast]---->|
   |                       |                    |
   |                       |<---[pull request]--|
   |                       |-[sync changes]---->|
```

### 8. Server Storage (`server/storage.ts`)

Server-side storage using SQLite.

**Tables:**
- `changes`: All changes from all clients
- `documents`: Current state of all documents
- `users`: User accounts (optional)
- `metadata`: Server metadata

**Features:**
- Efficient change log
- Point-in-time queries
- Pruning old changes
- Backup/restore
- Statistics

### 9. Authentication (`server/auth.ts`)

Optional authentication system.

**Features:**
- User registration and login
- Token-based authentication
- API keys
- Permission management
- Row-level security

**Example:**
```typescript
const auth = new AuthManager();
await auth.register('user@example.com', 'password');
const token = await auth.login('user@example.com', 'password');

// Use token in WebSocket connection
const db = new ElideDB({
  syncUrl: 'ws://localhost:3000',
  authToken: token.token
});
```

## Data Flow

### Write Operation (Offline)

```
1. User calls db.insert('users', data)
2. ElideDB creates Document with metadata:
   - id: unique ID
   - _version: 1
   - _timestamp: Date.now()
   - _clientId: client's ID
3. Document saved to LocalDB (IndexedDB/SQLite)
4. Change recorded in changelog
5. Promise resolves immediately
6. Subscription callbacks triggered
```

### Sync Operation (Online)

```
1. Sync timer triggers
2. SyncEngine.sync() called
3. Get changes since last sync from LocalDB
4. Send [push] message to server with changes
5. Server stores changes in ServerStorage
6. Server sends [ack] back to client
7. Server broadcasts changes to other clients
8. Client sends [pull] message
9. Server sends [sync] with remote changes
10. Client applies changes using ConflictResolver
11. LocalDB updated
12. Subscription callbacks triggered
```

### Conflict Resolution

```
1. Client receives remote change
2. Check if local change exists for same document
3. Compare timestamps and vector clocks
4. If concurrent (conflict detected):
   a. Apply resolution strategy
   b. Generate merged change
   c. Save to LocalDB
   d. Update vector clock
5. If no conflict:
   a. Apply remote change directly
```

## Design Decisions

### Why Local-First?

1. **Performance**: Zero latency for reads/writes
2. **Reliability**: Works offline, no network dependency
3. **User Experience**: Instant UI updates
4. **Cost**: Reduced server load and bandwidth

### Why SQL Instead of Datalog?

1. **Familiarity**: Developers know SQL
2. **Tooling**: Better IDE support
3. **Migration**: Easy to migrate from SQL databases
4. **Learning Curve**: Immediate productivity

### Why Vector Clocks?

1. **Causality**: Track causal relationships
2. **Conflict Detection**: Identify concurrent updates
3. **Distributed**: No central coordinator needed
4. **Efficient**: Small metadata overhead

### Why WebSocket?

1. **Bidirectional**: Server can push to clients
2. **Efficient**: Single persistent connection
3. **Real-time**: Low latency updates
4. **Standard**: Well-supported protocol

## Scalability

### Client-Side

- **Storage Limits**:
  - IndexedDB: ~50MB to unlimited (browser-dependent)
  - SQLite: Limited by disk space

- **Performance**:
  - Indexes for fast queries
  - Pagination for large datasets
  - Lazy loading subscriptions

### Server-Side

- **Horizontal Scaling**:
  - Stateless sync servers
  - Shared storage backend
  - Load balancer for WebSocket connections

- **Storage**:
  - SQLite for single server
  - PostgreSQL for distributed
  - Prune old changes periodically

## Security

### Client-Side

- Local data encryption (implement with Web Crypto API)
- Secure WebSocket (wss://)
- CORS protection

### Server-Side

- Authentication (JWT tokens)
- Authorization (permissions)
- Row-level security
- Rate limiting
- Input validation

## Future Enhancements

1. **CRDT Integration**: Use Yjs or Automerge for text editing
2. **Encryption**: End-to-end encryption
3. **Compression**: Compress sync payloads
4. **Delta Sync**: Only sync changed fields
5. **Partial Sync**: Sync subsets of data
6. **P2P Sync**: Direct device-to-device sync
7. **Schema Migration**: Automatic schema updates
8. **Time Travel**: Query historical data
