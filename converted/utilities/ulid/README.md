# ULID - Elide Polyglot Showcase

> **One ULID generator for ALL languages** - TypeScript, Python, Ruby, and Java

Universally Unique Lexicographically Sortable Identifiers - better than UUID for time-ordered data.

## ✨ Features

- ✅ Lexicographically sortable by timestamp
- ✅ 128-bit compatibility with UUID
- ✅ URL-safe (Crockford Base32)
- ✅ Monotonic ordering within same millisecond
- ✅ Cryptographically secure randomness
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { ulid, decodeTime } from './elide-ulid.ts';

// Generate ULID
const id = ulid();
console.log(id); // => "01ARZ3NDEKTSV4RRFFQ69G5FAV"

// Decode timestamp
const timestamp = decodeTime(id);
console.log(new Date(timestamp)); // => 2024-01-15T10:30:45.123Z

// Monotonic (same millisecond)
import { monotonicFactory } from './elide-ulid.ts';
const monotonic = monotonicFactory();
const id1 = monotonic();
const id2 = monotonic(); // Guaranteed to be > id1
```

## 💡 Use Cases

### Database Primary Keys

```typescript
interface User {
  id: string; // ULID
  username: string;
  createdAt: Date;
}

const user = {
  id: ulid(), // Sortable by creation time!
  username: "alice",
  createdAt: new Date()
};
```

### Event Sourcing

```typescript
interface Event {
  id: string;
  type: string;
}

const event = {
  id: ulid(), // Events naturally sorted by time
  type: "UserCreated"
};
```

## 📝 Package Stats

- **npm downloads**: ~2M/week
- **Format**: 26 characters (Crockford Base32)
- **Use case**: Time-ordered unique identifiers
- **Elide advantage**: Polyglot, sortable, URL-safe

---

**Built with ❤️ for the Elide Polyglot Runtime**
