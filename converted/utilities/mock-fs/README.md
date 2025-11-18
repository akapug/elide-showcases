# Mock FS - Mock Filesystem

Mock filesystem for testing without touching real files.

Based on [mock-fs](https://www.npmjs.com/package/mock-fs) (~300K+ downloads/week)

## Features

- ✅ Mock filesystem operations
- ✅ In-memory file system
- ✅ No real file I/O
- ✅ Zero dependencies

## Quick Start

```typescript
import mock from './elide-mock-fs.ts';

mock({
  '/tmp/test.txt': 'file content',
  '/data': {
    'file1.txt': 'content 1'
  }
});

mock.restore();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
