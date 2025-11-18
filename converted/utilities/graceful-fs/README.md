# graceful-fs - Elide Polyglot Showcase

> **Graceful file system operations for ALL languages**

Drop-in replacement for fs with improved error handling and queuing.

## Features

- Drop-in fs replacement
- Better error handling
- Operation queuing
- Retry logic
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import * as fs from './elide-graceful-fs.ts';

// Use like normal fs
const data = await fs.readFile('file.txt');
await fs.writeFile('output.txt', 'content');
await fs.mkdir('dir', { recursive: true });

// Sync versions
const content = fs.readFileSync('file.txt');
fs.writeFileSync('output.txt', 'data');
```

## Stats

- **npm downloads**: ~150M/week
- **Use case**: Robust file operations
