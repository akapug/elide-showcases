# Brotli - Modern Compression Algorithm - Elide Polyglot Showcase

> **One Brotli implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Modern compression algorithm developed by Google with 15-30% better compression ratios than gzip, perfect for HTTP compression across your entire polyglot stack.

## 🌟 Why This Matters

Different languages have different Brotli implementations:
- `brotli` module in Python (Python 3.7+)
- Native Brotli support varies by Ruby version
- Java requires third-party libraries
- Inconsistent compression quality and options

**Elide solves this** with ONE Brotli implementation that works in ALL languages with consistent compression.

## ✨ Features

- ✅ Better compression than gzip (15-30% improvement)
- ✅ Quality levels (0-11)
- ✅ Fast decompression
- ✅ Streaming support
- ✅ HTTP content encoding
- ✅ Dictionary support
- ✅ Optimized for web content
- ✅ Low memory usage
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import Brotli from './elide-brotli.ts';

// Compress
const compressed = Brotli.compress("Hello, World!");

// Decompress
const decompressed = Brotli.decompressSync(compressed);
console.log(decompressed);

// High quality compression
const best = Brotli.compress(data, { quality: 11 });
```

### Python
```python
from elide import require
brotli = require('./elide-brotli.ts')

# Compress
compressed = brotli.compress("Hello, World!")

# Decompress
decompressed = brotli.decompressSync(compressed)
print(decompressed)

# Custom quality
compressed = brotli.compress(data, {'quality': 6})
```

### Ruby
```ruby
brotli = Elide.require('./elide-brotli.ts')

# Compress
compressed = brotli.compress("Hello, World!")

# Decompress
decompressed = brotli.decompressSync(compressed)
puts decompressed
```

### Java
```java
Value brotli = context.eval("js", "require('./elide-brotli.ts')");

// Compress
Value compressed = brotli.invokeMember("compress", "Hello, World!");

// Decompress
String decompressed = brotli.invokeMember("decompressSync", compressed).asString();
```

## 💡 Real-World Use Cases

### HTTP Compression
```typescript
import Brotli from './elide-brotli.ts';

// Express middleware
app.use((req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    if (req.headers['accept-encoding']?.includes('br')) {
      const compressed = Brotli.compress(data, { quality: 6 });
      res.setHeader('Content-Encoding', 'br');
      return originalSend.call(this, compressed);
    }
    return originalSend.call(this, data);
  };

  next();
});
```

### Static Asset Compression
```typescript
// Pre-compress static files
const cssContent = await readFile('styles.css', 'utf-8');
const compressed = Brotli.compress(cssContent, { quality: 11, mode: 'text' });

await writeFile('styles.css.br', compressed);
```

### API Response Optimization
```typescript
// Compress large JSON responses
const apiData = { users: [...], posts: [...] };
const json = JSON.stringify(apiData);
const compressed = Brotli.compress(json, { quality: 6 });

// Save 20-40% bandwidth
```

### CDN Integration
```typescript
import { createBrotliCompress } from './elide-brotli.ts';

const brotli = createBrotliCompress({ quality: 11 });
const compressed = brotli.compress(htmlContent);

// Upload to CDN
await cdn.upload('index.html.br', compressed);
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language has different Brotli support

```
Node.js: zlib.createBrotliCompress()
Python: brotli.compress() (Python 3.7+)
Ruby: gem 'brotli' (third-party)
Java: com.nixxcode.jvmbrotli

Result:
❌ Inconsistent availability
❌ Different APIs
❌ Version dependencies
❌ Platform-specific builds
```

### The Solution
**After**: One Elide Brotli for all languages

```
┌────────────────────────────────┐
│  Elide Brotli (TypeScript)    │
│  elide-brotli.ts              │
└────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │  CDN   │  │ Python │  │  Java  │
    │Service │  │  API   │  │Backend │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ Same compression everywhere
✅ Consistent quality levels
✅ Better bandwidth savings
```

## 📖 API Reference

### `Brotli.compress(data, options?)`
Compress data using Brotli algorithm

### `Brotli.decompress(data)`
Decompress Brotli data

### `Brotli.compressSync(data, options?)`
Synchronous compression

### `Brotli.decompressSync(data)`
Synchronous decompression

### `createBrotliCompress(options?)`
Create Brotli compression stream

### `createBrotliDecompress()`
Create Brotli decompression stream

### Options
- `quality`: 0-11 (default: 11)
- `mode`: 'text' | 'font' | 'generic'
- `lgwin`: Window size parameter

## 🧪 Testing

```bash
elide run elide-brotli.ts
```

## 📂 Files

- `elide-brotli.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm brotli package](https://www.npmjs.com/package/brotli)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~40M/week
- **Use case**: Modern HTTP compression
- **Elide advantage**: One Brotli for all languages
- **Polyglot score**: 48/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Better compression, everywhere.*
