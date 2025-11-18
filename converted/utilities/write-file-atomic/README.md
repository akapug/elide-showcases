# write-file-atomic - Elide Polyglot Showcase

> **Atomic file writing for ALL languages**

Write files atomically to prevent corruption - writes to temp then renames.

## Features

- Atomic writes (temp + rename)
- Corruption prevention
- Permission preservation
- Async/sync versions
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { writeFileAtomic } from './elide-write-file-atomic.ts';

// Write JSON atomically
await writeFileAtomic(
  'config.json',
  JSON.stringify(data, null, 2)
);

// With permissions
await writeFileAtomic('secure.txt', 'secret', {
  mode: 0o600
});

// Sync version
writeFileAtomicSync('important.txt', 'critical data');
```

## Stats

- **npm downloads**: ~80M/week
- **Use case**: Config files, databases, critical data
