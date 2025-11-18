# fs-extra - Elide Polyglot Showcase

> **Enhanced file system operations for ALL languages** - TypeScript, Python, Ruby, and Java

Extended fs methods with copy, move, remove, ensure, and JSON utilities that work across your entire polyglot stack.

## Features

- Copy files and directories with options
- Move files across devices
- Ensure directories and files exist
- Read/write JSON with formatting
- Remove files recursively
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies
- Promise-based and sync versions

## Quick Start

```typescript
import { copy, ensureDir, readJson, writeJson, remove } from './elide-fs-extra.ts';

// Copy with structure preservation
await copy('src', 'dist');

// Ensure directory exists
await ensureDir('path/to/dir');

// JSON operations
const config = await readJson('config.json');
await writeJson('output.json', { foo: 'bar' });

// Clean up
await remove('temp');
```

## Use Cases

- Build scripts and automation
- File management in applications
- Config file handling
- Test setup/teardown
- Deployment scripts

## Stats

- **npm downloads**: ~80M/week
- **Use case**: Enhanced file operations
- **Elide advantage**: One implementation for all languages
