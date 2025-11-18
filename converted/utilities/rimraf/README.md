# rimraf - Elide Polyglot Showcase

> **Recursive file deletion for ALL languages** - TypeScript, Python, Ruby, and Java

Unix `rm -rf` for Node.js and Elide - remove files and directories recursively with force.

## Features

- Recursive deletion
- Retry logic for locked files
- No error if path doesn't exist
- Sync and async versions
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { rimraf, rimrafSync } from './elide-rimraf.ts';

// Remove file or directory
await rimraf('temp');
await rimraf('node_modules');

// With retry options
await rimraf('locked-file.txt', {
  maxRetries: 5,
  retryDelay: 200
});

// Sync version
rimrafSync('dist');
```

## Use Cases

- Build script cleanup
- Test teardown
- Deployment preparation
- Cache clearing
- Temp file management

## Stats

- **npm downloads**: ~80M/week
- **Use case**: Recursive file removal
- **Elide advantage**: Consistent behavior across platforms
