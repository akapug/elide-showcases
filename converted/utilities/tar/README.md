# Tar - TAR Archive Format - Elide Polyglot Showcase

> **One TAR implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Create and extract TAR (Tape Archive) format archives with full metadata support across your polyglot stack.

## 🌟 Why This Matters

TAR is the universal archive format for Unix systems, software distribution, and Docker images.

**Elide provides** the same TAR implementation across ALL languages.

## ✨ Features

- ✅ Create TAR archives
- ✅ Extract TAR archives
- ✅ File metadata preservation
- ✅ Directory support
- ✅ POSIX tar format
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { create, extract } from './elide-tar.ts';

// Create archive
const tar = create();
tar.addFile('readme.txt', 'Hello, TAR!');
tar.addDirectory('src');
tar.addFile('src/index.ts', 'console.log("Hi");');
const archive = tar.generate();

// Extract archive
const entries = extract(archive);
entries.forEach(entry => {
  console.log(entry.name, entry.size);
});
```

### Python
```python
from elide import require
tar = require('./elide-tar.ts')

# Create
archive = tar.create()
archive.addFile('readme.txt', 'Hello, TAR!')
data = archive.generate()
```

## 💡 Real-World Use Cases

### Software Distribution
```typescript
import { create } from './elide-tar.ts';

const tar = create();
tar.addFile('package.json', JSON.stringify(pkg));
tar.addFile('README.md', readmeContent);
tar.addDirectory('dist');
tar.addFile('dist/index.js', compiled);

const tarball = tar.generate();
await writeFile('package.tar', tarball);
```

## 📖 API Reference

### `create()`
Create new TAR archive

### `extract(data)`
Extract TAR archive

### `tar.addFile(name, data, options?)`
Add file to archive

### `tar.addDirectory(name, options?)`
Add directory to archive

## 📝 Package Stats

- **npm downloads**: ~40M/week
- **Use case**: Archive creation and extraction
- **Elide advantage**: Cross-platform archives
- **Polyglot score**: 49/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
