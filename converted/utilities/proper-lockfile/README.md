# proper-lockfile - Elide Polyglot Showcase

> **File locking for ALL languages**

Inter-process and inter-machine file locking to prevent concurrent access.

## Features

- Inter-process locking
- Stale lock detection
- Retry logic
- Async/sync versions
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { lock, unlock, check } from './elide-proper-lockfile.ts';

// Lock with auto-unlock
const release = await lock('database.db');
try {
  // Critical section
  await processDatabase();
} finally {
  await release();
}

// Manual unlock
await lock('file.txt');
await unlock('file.txt');

// Check lock status
const isLocked = await check('file.txt');
```

## Stats

- **npm downloads**: ~15M/week
- **Use case**: Database files, shared resources
