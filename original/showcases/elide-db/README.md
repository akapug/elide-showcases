# ElideDB

> Local-first real-time database - works offline, syncs in background, uses SQL

ElideDB is a local-first database that prioritizes offline functionality and seamless synchronization. Unlike InstantDB which requires connectivity, ElideDB is **truly offline-first** - it works completely disconnected and syncs when connection is restored.

## Key Features

- **🔌 True Offline-First**: Works completely disconnected, no internet required
- **🔄 Real-time Sync**: Automatic background synchronization when online
- **📦 Embedded**: Database runs in your binary, no separate server needed
- **🗃️ SQL Queries**: Familiar SQL-like syntax instead of Datalog
- **⚡ Optimistic Updates**: Instant local updates with conflict resolution
- **🔀 Multi-device Sync**: Sync data across unlimited devices
- **🎯 Type-safe**: Full TypeScript support with strong typing
- **📱 Cross-platform**: Works in browser (IndexedDB) and Node.js (SQLite)

## Why ElideDB vs InstantDB?

| Feature | ElideDB | InstantDB |
|---------|---------|-----------|
| Offline Support | ✅ **True offline** | ⚠️ Limited |
| Query Language | **SQL** (familiar) | Datalog (learning curve) |
| Deployment | **Embedded in binary** | Requires hosted service |
| Backend Language | **Polyglot** (any language) | JavaScript only |
| Self-hosted | ✅ Yes | Limited |
| Local-first | ✅ Database in your app | ❌ Remote-first |

## Quick Start

### Installation

```bash
npm install elide-db
```

### Basic Usage

```typescript
import { ElideDB } from 'elide-db';

// Create database instance
const db = new ElideDB({
  name: 'my-app',
  syncUrl: 'ws://localhost:3000' // Optional for offline-only
});

// Define schema
await db.init([
  {
    name: 'todos',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'completed', type: 'boolean', required: true },
      { name: 'priority', type: 'string' }
    ]
  }
]);

// Insert data (works offline!)
await db.insert('todos', {
  title: 'Build something awesome',
  completed: false,
  priority: 'high'
});

// Query with SQL-like syntax
const todos = await db.table('todos')
  .where('completed', false)
  .orderBy('priority', 'DESC')
  .limit(10)
  .get();

// Real-time subscriptions
db.table('todos').subscribe((todos) => {
  console.log('Todos updated:', todos);
});
```

## Architecture

```
┌─────────────────────────────────────┐
│         Your Application            │
├─────────────────────────────────────┤
│         ElideDB Client              │
│  ┌──────────┐      ┌──────────┐    │
│  │ Query    │      │Subscribe │    │
│  │ Builder  │      │ Manager  │    │
│  └──────────┘      └──────────┘    │
├─────────────────────────────────────┤
│          Sync Engine                │
│  ┌──────────────────────────────┐  │
│  │   Conflict Resolution        │  │
│  │   Vector Clocks + CRDTs      │  │
│  └──────────────────────────────┘  │
├─────────────────────────────────────┤
│        Local Storage                │
│  ┌──────────┐      ┌──────────┐    │
│  │IndexedDB │  or  │  SQLite  │    │
│  │(Browser) │      │  (Node)  │    │
│  └──────────┘      └──────────┘    │
└─────────────────────────────────────┘
            ↕ WebSocket ↕
┌─────────────────────────────────────┐
│         Sync Server                 │
│  ┌──────────────────────────────┐  │
│  │      Server Storage          │  │
│  │      (SQLite/Postgres)       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Core Concepts

### 1. Local-First Architecture

ElideDB stores all data locally first. Every operation works offline:

```typescript
// All of these work without internet connection
await db.insert('todos', { title: 'Learn ElideDB' });
const todos = await db.table('todos').get();
await db.update('todos', id, { completed: true });
await db.delete('todos', id);
```

### 2. SQL-Like Query Builder

Familiar SQL syntax instead of learning Datalog:

```typescript
// Simple queries
db.table('users').where('age', '>', 18).get();

// Complex queries
db.table('products')
  .where('category', 'electronics')
  .whereGreaterThan('price', 100)
  .whereLessThan('price', 500)
  .orderBy('rating', 'DESC')
  .limit(10)
  .get();

// Aggregations
await db.table('orders').sum('amount');
await db.table('products').avg('rating');
await db.table('items').count();
```

### 3. Real-time Subscriptions

Subscribe to query results and get notified of changes:

```typescript
const subscription = db.table('messages')
  .where('channel', 'general')
  .orderBy('timestamp', 'DESC')
  .subscribe((messages) => {
    // Called whenever data changes
    renderMessages(messages);
  });

// Unsubscribe when done
subscription.unsubscribe();
```

### 4. Conflict Resolution

ElideDB automatically resolves conflicts using multiple strategies:

```typescript
const db = new ElideDB({
  name: 'my-app',
  conflictResolution: 'LAST_WRITE_WINS' // or 'FIRST_WRITE_WINS', 'CUSTOM'
});

// Custom conflict resolution
const resolver = new ConflictResolver('CUSTOM', (local, remote) => {
  // Your custom logic
  return local.timestamp > remote.timestamp ? local : remote;
});
```

### 5. Multi-device Sync

Sync seamlessly across devices:

```typescript
// Device 1: Create data
await db.insert('notes', { title: 'My Note', content: 'Hello' });

// Automatically syncs to server

// Device 2: Data appears automatically via subscription
db.table('notes').subscribe((notes) => {
  console.log('Received from Device 1:', notes);
});
```

## API Reference

### ElideDB

Main database class.

```typescript
const db = new ElideDB({
  name: 'my-db',           // Database name
  clientId: 'unique-id',    // Optional: unique client ID
  syncUrl: 'ws://...',      // Optional: sync server URL
  syncInterval: 5000,       // Optional: sync interval in ms
  conflictResolution: '...' // Optional: conflict strategy
});

// Initialize with schema
await db.init(schemas);

// CRUD operations
await db.insert(table, data);
await db.update(table, id, updates);
await db.delete(table, id);
await db.get(table, id);

// Query builder
db.table(name);

// Sync control
await db.sync();           // Force sync
db.isConnected();          // Check connection
db.isSyncing();            // Check sync status
db.getReplicationState();  // Get sync state

// Lifecycle
await db.close();
```

### QueryBuilder

SQL-like query builder.

```typescript
db.table('users')
  // Filters
  .where('field', 'operator', value)
  .whereEquals('status', 'active')
  .whereGreaterThan('age', 18)
  .whereIn('role', ['admin', 'moderator'])
  .whereLike('email', '%@example.com')

  // Sorting
  .orderBy('name', 'ASC')
  .orderByDesc('createdAt')

  // Pagination
  .limit(10)
  .offset(20)
  .paginate(2, 10)

  // Execution
  .get()                // Get results
  .first()              // Get first result
  .count()              // Count results
  .exists()             // Check if any exist

  // Aggregations
  .sum('amount')
  .avg('rating')
  .min('price')
  .max('price')

  // Subscriptions
  .subscribe(callback)
```

### Subscriptions

Real-time data subscriptions.

```typescript
// Subscribe to query
const sub = db.table('items')
  .where('status', 'active')
  .subscribe((items) => {
    console.log('Items updated:', items);
  });

// Unsubscribe
sub.unsubscribe();

// React hook (example)
import { useElideQuery } from 'elide-db';

function MyComponent() {
  const { data, loading } = useElideQuery(
    { table: 'todos', where: { completed: false } },
    subscriptionManager
  );
}
```

## Examples

### 1. Collaborative Todo App

Real-time todo list with multi-user collaboration:

```typescript
import { CollaborativeTodoApp } from 'elide-db/examples/collaborative-todo';

const app = new CollaborativeTodoApp('ws://localhost:3000');
await app.init();

await app.createTodo('Build feature', 'high', ['development']);
await app.assignTodo(todoId, userId);

// Real-time updates
app.subscribeToTodos((todos) => {
  renderTodos(todos);
});
```

### 2. Offline Notes App

Note-taking app that works completely offline:

```typescript
import { OfflineNotesApp } from 'elide-db/examples/offline-notes';

const app = new OfflineNotesApp();
await app.init();

// Works offline!
await app.createNote('My Note', 'Content here', {
  tags: ['important'],
  color: 'yellow'
});

// Export/import
const json = await app.exportNotes();
await app.importNotes(json);
```

### 3. Multiplayer Game

Real-time multiplayer tic-tac-toe:

```typescript
import { MultiplayerTicTacToe } from 'elide-db/examples/multiplayer-game';

const game = new MultiplayerTicTacToe('Alice', 'ws://localhost:3000');
await game.init();

const gameSession = await game.createGame();
await game.makeMove(gameSession.id, 4); // Center

// Real-time game updates
game.subscribeToGame(gameSession.id, (game) => {
  game.displayBoard(game.board);
});
```

## Server Setup

### Quick Start

```typescript
import { createServer } from 'elide-db';

const server = createServer({
  port: 3000,
  dbPath: './data/elidedb.db'
});

await server.start();
console.log('Sync server running on port 3000');
```

### With Authentication

```typescript
import { SyncServer, ServerStorage, AuthManager } from 'elide-db';

const storage = new ServerStorage('./data/elidedb.db');
const auth = new AuthManager();

const server = new SyncServer({
  port: 3000,
  storage,
  auth
});

await server.start();

// Register user
await auth.register('user@example.com', 'password');

// Login and get token
const token = await auth.login('user@example.com', 'password');
```

## Polyglot Backend

ElideDB server can be implemented in any language. Here's a Python example:

```python
# Python sync server implementation
import asyncio
import websockets
import json

async def handle_client(websocket, path):
    async for message in websocket:
        data = json.loads(message)

        if data['type'] == 'push':
            # Store changes
            await storage.store_changes(data['changes'])
            await websocket.send(json.dumps({
                'type': 'ack',
                'clientId': 'server'
            }))

        elif data['type'] == 'pull':
            # Send changes
            changes = await storage.get_changes(data['lastSyncTime'])
            await websocket.send(json.dumps({
                'type': 'sync',
                'changes': changes
            }))

# Start server
start_server = websockets.serve(handle_client, 'localhost', 3000)
asyncio.get_event_loop().run_until_complete(start_server)
```

## Advanced Features

### Transactions

```typescript
await db.transaction(async (tx) => {
  await tx.insert('accounts', { id: '1', balance: 100 });
  await tx.update('accounts', '2', { balance: 50 });
  await tx.delete('logs', 'old-log');
  // Auto-commit on success, rollback on error
});
```

### File Attachments

```typescript
await db.insert('posts', {
  title: 'My Post',
  content: 'Hello',
  attachments: [
    {
      name: 'image.jpg',
      data: blob,
      mimeType: 'image/jpeg'
    }
  ]
});
```

### Custom Conflict Resolution

```typescript
const resolver = new ConflictResolver('CUSTOM', (local, remote) => {
  // Merge both changes
  return {
    ...local,
    data: {
      ...local.data,
      ...remote.data,
      mergedAt: Date.now()
    }
  };
});
```

## Performance

ElideDB is designed for performance:

- **Local-first**: Zero network latency for reads/writes
- **Efficient sync**: Only syncs changes, not entire datasets
- **Indexed queries**: Uses indexes for fast lookups
- **Batched updates**: Groups multiple changes into single sync
- **Optimistic UI**: Instant UI updates without waiting for server

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guide.

## Support

- GitHub Issues: [github.com/elide/elidedb/issues](https://github.com/elide/elidedb/issues)
- Documentation: [elidedb.dev/docs](https://elidedb.dev/docs)
- Discord: [discord.gg/elidedb](https://discord.gg/elidedb)
