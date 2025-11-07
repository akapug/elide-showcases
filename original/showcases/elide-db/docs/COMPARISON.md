# ElideDB vs Alternatives

Comparison of ElideDB with other local-first and real-time databases.

## ElideDB vs InstantDB

| Feature | ElideDB | InstantDB |
|---------|---------|-----------|
| **Offline Support** | ✅ True offline-first, works completely disconnected | ⚠️ Limited offline support |
| **Query Language** | **SQL** - familiar syntax | **Datalog** - learning curve required |
| **Deployment** | **Embedded** in your binary | Requires hosted service |
| **Backend** | Any language (polyglot) | JavaScript only |
| **Self-hosted** | ✅ Full control | Limited |
| **Architecture** | Database runs in app | Remote-first with caching |
| **Latency** | Zero (local reads) | Network-dependent |
| **Cost** | Self-host for free | Pricing per usage |
| **Open Source** | ✅ MIT License | ✅ Apache 2.0 |

**When to choose ElideDB:**
- Need true offline functionality
- Want SQL-like queries
- Self-hosted deployment
- Polyglot backend (Python, Go, Rust, etc.)

**When to choose InstantDB:**
- Want managed hosting
- Prefer Datalog queries
- JavaScript-only stack

## ElideDB vs RxDB

| Feature | ElideDB | RxDB |
|---------|---------|------|
| **Sync Protocol** | Custom WebSocket | CouchDB replication |
| **Conflict Resolution** | Vector clocks + CRDTs | CouchDB's revision tree |
| **Query API** | SQL-like fluent API | RxQuery (MongoDB-like) |
| **TypeScript** | ✅ Built-in | ✅ Built-in |
| **Backend** | Custom (any language) | CouchDB/PouchDB |
| **Bundle Size** | ~50KB | ~150KB |
| **Learning Curve** | Low (SQL-familiar) | Medium (RxJS + MongoDB) |
| **Reactive** | Subscriptions | RxJS Observables |

**When to choose ElideDB:**
- Want SQL-like queries
- Don't need RxJS observables
- Smaller bundle size
- Custom backend

**When to choose RxDB:**
- Already using RxJS
- Need CouchDB ecosystem
- Complex reactive patterns

## ElideDB vs WatermelonDB

| Feature | ElideDB | WatermelonDB |
|---------|---------|--------------|
| **Platform** | Browser + Node.js | React Native focused |
| **Query API** | SQL-like | Custom query API |
| **Sync** | Built-in WebSocket | Bring your own |
| **Performance** | IndexedDB/SQLite | Native SQLite |
| **Relations** | Manual | Built-in associations |
| **React Native** | ❌ Not optimized | ✅ Optimized |

**When to choose ElideDB:**
- Web applications
- Built-in sync needed
- SQL-like API preference

**When to choose WatermelonDB:**
- React Native apps
- Need high performance on mobile
- Want built-in relations

## ElideDB vs Dexie.js

| Feature | ElideDB | Dexie.js |
|---------|---------|----------|
| **Sync** | ✅ Built-in | ❌ None (separate addon) |
| **Real-time** | ✅ Built-in | ❌ Manual implementation |
| **API Style** | SQL-like | IndexedDB-like |
| **Multi-device** | ✅ Yes | ❌ Local only |
| **Conflict Resolution** | ✅ Built-in | ❌ Manual |
| **Backend** | Included | Not included |

**When to choose ElideDB:**
- Need sync and real-time
- Multi-device sync
- Backend included

**When to choose Dexie.js:**
- Local-only database
- Don't need sync
- Familiar with IndexedDB

## ElideDB vs Firebase/Firestore

| Feature | ElideDB | Firebase/Firestore |
|---------|---------|-------------------|
| **Offline** | ✅ True offline-first | ⚠️ Cache-based |
| **Pricing** | Free (self-hosted) | Pay per usage |
| **Vendor Lock-in** | ❌ None | ⚠️ Google ecosystem |
| **Self-hosted** | ✅ Yes | ❌ No |
| **SQL Queries** | ✅ Yes | ❌ NoSQL only |
| **Real-time** | ✅ Yes | ✅ Yes |
| **Auth** | Optional | Built-in |
| **Scalability** | Depends on deployment | Google-scale |

**When to choose ElideDB:**
- Want self-hosting
- Need full control
- Prefer SQL queries
- Avoid vendor lock-in

**When to choose Firebase:**
- Want managed hosting
- Need Google-scale infrastructure
- Want integrated services (auth, storage, etc.)

## ElideDB vs PouchDB

| Feature | ElideDB | PouchDB |
|---------|---------|---------|
| **Sync Protocol** | Custom WebSocket | CouchDB replication |
| **Query API** | SQL-like | Map/Reduce + Mango |
| **Conflict Resolution** | Vector clocks | Revision tree |
| **Backend** | Any | CouchDB required |
| **Performance** | Optimized | General-purpose |
| **Bundle Size** | ~50KB | ~45KB |
| **Maturity** | New | Mature (10+ years) |

**When to choose ElideDB:**
- Want SQL queries
- Custom backend
- Modern architecture

**When to choose PouchDB:**
- Need CouchDB compatibility
- Mature ecosystem
- Battle-tested

## ElideDB vs Supabase

| Feature | ElideDB | Supabase |
|---------|---------|----------|
| **Architecture** | Local-first | Server-first |
| **Offline** | ✅ True offline | ⚠️ Client library |
| **Database** | Embedded | PostgreSQL |
| **Real-time** | ✅ Built-in | ✅ PostgreSQL LISTEN |
| **Hosting** | Self-host | Managed or self-host |
| **SQL** | Client-side | Server-side |
| **Auth** | Optional | Built-in |
| **Storage** | Local | Server |

**When to choose ElideDB:**
- True local-first
- Embedded database
- Offline-first apps

**When to choose Supabase:**
- PostgreSQL features
- Server-side logic
- Managed backend

## Summary Table

| Database | Local-First | Offline | SQL | Sync | Self-host | Open Source |
|----------|------------|---------|-----|------|-----------|-------------|
| **ElideDB** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| InstantDB | ⚠️ | ⚠️ | ❌ | ✅ | ⚠️ | ✅ |
| RxDB | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| WatermelonDB | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ |
| Dexie.js | ✅ | ✅ | ❌ | ❌ | N/A | ✅ |
| Firebase | ❌ | ⚠️ | ❌ | ✅ | ❌ | ❌ |
| PouchDB | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Supabase | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ |

Legend:
- ✅ Yes / Excellent
- ⚠️ Partial / Limited
- ❌ No / Not available
- N/A Not applicable

## Use Case Recommendations

### ElideDB is best for:

1. **Offline-first web apps**
   - Note-taking apps
   - Task managers
   - Document editors
   - Field data collection

2. **Real-time collaboration**
   - Multiplayer games
   - Collaborative editing
   - Chat applications
   - Live dashboards

3. **Multi-device sync**
   - Personal productivity apps
   - Cross-device experiences
   - Cloud backup with sync

4. **Self-hosted solutions**
   - Internal tools
   - Privacy-focused apps
   - Air-gapped deployments
   - Cost-conscious projects

5. **Polyglot backends**
   - Python web services
   - Go microservices
   - Rust applications
   - Multi-language stacks

### Not ideal for:

1. **Mobile-only apps** (consider WatermelonDB)
2. **Need PostgreSQL features** (consider Supabase)
3. **Want managed hosting** (consider Firebase/InstantDB)
4. **Complex server-side logic** (consider traditional backend)
5. **Need CouchDB ecosystem** (consider PouchDB/RxDB)

## Migration Guide

### From InstantDB to ElideDB

```typescript
// InstantDB
db.transact([
  tx.todos[id()].update({ title: 'Hello' })
]);

// ElideDB (SQL-like)
await db.update('todos', id, { title: 'Hello' });
```

### From RxDB to ElideDB

```typescript
// RxDB
const results = await db.todos.find({
  selector: { completed: false }
}).exec();

// ElideDB
const results = await db.table('todos')
  .where('completed', false)
  .get();
```

### From Firebase to ElideDB

```typescript
// Firebase
const snapshot = await db.collection('todos')
  .where('completed', '==', false)
  .get();

// ElideDB
const todos = await db.table('todos')
  .where('completed', false)
  .get();
```

## Conclusion

ElideDB shines in scenarios requiring:
- True offline functionality
- SQL-like query syntax
- Self-hosted deployment
- Polyglot backend support
- Lightweight bundle size

Choose alternatives when you need:
- Managed hosting (Firebase, Supabase)
- Specific ecosystems (CouchDB → PouchDB)
- Mobile optimization (WatermelonDB)
- Complex reactive patterns (RxDB)
