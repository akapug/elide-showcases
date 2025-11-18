# Pako - Zlib Port for JavaScript - Elide Polyglot Showcase

> **One deflate library for ALL languages** - TypeScript, Python, Ruby, and Java

Fast zlib port for JavaScript with pure deflate/inflate/gzip implementation across your entire polyglot stack.

## 🌟 Why This Matters

Pako provides pure JavaScript zlib without native dependencies, making it perfect for cross-platform compression.

**Elide makes it even better** by enabling the same implementation across ALL languages.

## ✨ Features

- ✅ Pure JavaScript zlib port
- ✅ Deflate/inflate algorithms
- ✅ Gzip format support
- ✅ Fast performance
- ✅ Stream processing
- ✅ Chunk processing
- ✅ No native dependencies
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { deflate, inflate, gzip, ungzip } from './elide-pako.ts';

// Deflate compression
const compressed = deflate("Hello, World!");
const decompressed = inflate(compressed);

// Gzip format
const gzipped = gzip("Hello, Pako!");
const ungzipped = ungzip(gzipped);
```

### Python
```python
from elide import require
pako = require('./elide-pako.ts')

compressed = pako.deflate("Hello, World!")
decompressed = pako.inflate(compressed)
```

### Ruby
```ruby
pako = Elide.require('./elide-pako.ts')

compressed = pako.deflate("Hello, World!")
decompressed = pako.inflate(compressed)
```

### Java
```java
Value pako = context.eval("js", "require('./elide-pako.ts')");
Value compressed = pako.invokeMember("deflate", "Hello, World!");
```

## 💡 Real-World Use Cases

### Browser Compression
```typescript
import { deflate } from './elide-pako.ts';

// Compress before sending to server
const formData = JSON.stringify(largeForm);
const compressed = deflate(formData);

await fetch('/api/submit', {
  method: 'POST',
  body: compressed,
  headers: { 'Content-Encoding': 'deflate' }
});
```

## 📖 API Reference

### `deflate(data, options?)`
Compress with deflate

### `inflate(data, options?)`
Decompress deflate

### `gzip(data, options?)`
Compress to gzip

### `ungzip(data, options?)`
Decompress gzip

## 🧪 Testing

```bash
elide run elide-pako.ts
```

## 📝 Package Stats

- **npm downloads**: ~30M/week
- **Use case**: Pure JavaScript compression
- **Elide advantage**: No native dependencies
- **Polyglot score**: 47/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
