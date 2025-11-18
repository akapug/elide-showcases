# Zlib - Compression Library - Elide Polyglot Showcase

> **One compression library for ALL languages** - TypeScript, Python, Ruby, and Java

Industry-standard compression library implementing deflate/inflate and gzip algorithms for efficient data compression across your entire polyglot stack.

## 🌟 Why This Matters

Different languages have different compression libraries with inconsistent APIs:
- `zlib` module in Python has different API
- `Zlib` module in Ruby requires different setup
- `java.util.zip` in Java is verbose and complex
- Each language has different compression levels and options

**Elide solves this** with ONE compression library that works in ALL languages with a consistent API.

## ✨ Features

- ✅ Deflate/inflate compression
- ✅ Gzip format support
- ✅ Raw deflate streams
- ✅ Compression levels (0-9)
- ✅ Streaming API
- ✅ Buffer-based compression
- ✅ Memory efficient
- ✅ Fast performance
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import Zlib from './elide-zlib.ts';

// Compress with deflate
const compressed = Zlib.deflate("Hello, World!");

// Decompress
const decompressed = Zlib.inflateSync(compressed);
console.log(decompressed); // "Hello, World!"

// Gzip compression
const gzipped = Zlib.gzip("Hello, Elide!");
const gunzipped = Zlib.gunzip(gzipped);
```

### Python
```python
from elide import require
zlib = require('./elide-zlib.ts')

# Compress
compressed = zlib.deflate("Hello, World!")

# Decompress
decompressed = zlib.inflateSync(compressed)
print(decompressed)

# Gzip
gzipped = zlib.gzip("Data to compress")
```

### Ruby
```ruby
zlib = Elide.require('./elide-zlib.ts')

# Compress
compressed = zlib.deflate("Hello, World!")

# Decompress
decompressed = zlib.inflateSync(compressed)
puts decompressed

# Gzip compression
gzipped = zlib.gzip("Hello, Elide!")
```

### Java
```java
Value zlib = context.eval("js", "require('./elide-zlib.ts')");

// Compress
Value compressed = zlib.invokeMember("deflate", "Hello, World!");

// Decompress
String decompressed = zlib.invokeMember("inflateSync", compressed).asString();
System.out.println(decompressed);
```

## 💡 Real-World Use Cases

### HTTP Compression
```typescript
import Zlib from './elide-zlib.ts';

// Compress response data
const responseData = JSON.stringify({ users: [...] });
const compressed = Zlib.gzip(responseData);

// Send with proper headers
response.setHeader('Content-Encoding', 'gzip');
response.send(compressed);
```

### File Compression
```typescript
// Compress file data
const fileContent = await readFile('large-file.json');
const compressed = Zlib.deflate(fileContent, { level: 9 });

// Save compressed version
await writeFile('large-file.json.deflate', compressed);
```

### Data Transmission
```typescript
// Compress before sending over network
const data = { large: "payload", with: "lots", of: "data" };
const compressed = Zlib.gzip(JSON.stringify(data));

await sendToServer(compressed);
```

### Streaming Compression
```typescript
import { createGzip, createGunzip } from './elide-zlib.ts';

const gzip = createGzip({ level: 6 });
const compressed = gzip.compress("Stream data");

const gunzip = createGunzip();
const decompressed = gunzip.decompress(compressed);
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language requires different compression libraries

```
Node.js: zlib module (built-in)
Python: zlib module (built-in)
Ruby: Zlib module (built-in)
Java: java.util.zip.*

Result:
❌ Different APIs to learn
❌ Inconsistent compression options
❌ Different error handling
❌ Hard to share compressed data
```

### The Solution
**After**: One Elide compression library for all languages

```
┌────────────────────────────────┐
│  Elide Zlib (TypeScript)      │
│  elide-zlib.ts                │
└────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │ Script │  │Service │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ One compression API
✅ Consistent behavior
✅ Easy data sharing
```

## 📖 API Reference

### `Zlib.deflate(data, options?)`
Compress data using deflate algorithm

### `Zlib.inflate(data)`
Decompress deflated data

### `Zlib.gzip(data, options?)`
Compress to gzip format

### `Zlib.gunzip(data)`
Decompress gzip data

### `Zlib.deflateSync(data, options?)`
Synchronous deflate compression

### `Zlib.inflateSync(data)`
Synchronous inflate decompression

### `createDeflate(options?)`
Create deflate compression stream

### `createInflate()`
Create inflate decompression stream

### `createGzip(options?)`
Create gzip compression stream

### `createGunzip()`
Create gunzip decompression stream

## 🧪 Testing

```bash
elide run elide-zlib.ts
```

## 📂 Files

- `elide-zlib.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm zlib package](https://www.npmjs.com/package/zlib)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~80M/week
- **Use case**: Data compression and decompression
- **Elide advantage**: One compression library for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One compression library to rule them all.*
