# mock-fs - File System Mocking

**Pure TypeScript implementation of mock-fs for Elide.**

Based on [mock-fs](https://www.npmjs.com/package/mock-fs) (~2M+ downloads/week)

## Features

- In-memory file system
- Mock directories and files
- Standard fs operations
- Zero dependencies

## Installation

```bash
elide install @elide/mock-fs
```

## Usage

```typescript
import mockFS from './elide-mock-fs.ts';

// Mock file structure
mockFS.mock({
  'tmp': {
    'file.txt': 'content',
    'data': {
      'config.json': '{}',
    },
  },
});

// Use fs operations
const content = mockFS.readFileSync('tmp/file.txt');
mockFS.writeFileSync('tmp/new.txt', 'data');
const files = mockFS.readdirSync('tmp');

// Restore
mockFS.restore();
```

## API Reference

- `mock(structure)` - Mock file system
- `restore()` - Restore original
- `readFileSync(path)` - Read file
- `writeFileSync(path, data)` - Write file
- `existsSync(path)` - Check existence
- `mkdirSync(path)` - Create directory
- `readdirSync(path)` - List directory
- `statSync(path)` - File stats
- `unlinkSync(path)` - Delete file
- `rmdirSync(path)` - Delete directory

## Performance

- **2M+ downloads/week** - Popular mocking library

## License

MIT
