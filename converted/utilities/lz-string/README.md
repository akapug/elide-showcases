# LZ-String - String Compression - Elide Polyglot Showcase

> **One string compression for ALL languages** - TypeScript, Python, Ruby, and Java

LZ-based compression optimized for JavaScript strings, perfect for localStorage, URL parameters, and cookies across your polyglot stack.

## 🌟 Why This Matters

String compression is essential for browser applications and data storage. LZ-String provides string-to-string compression with URI-safe encoding.

**Elide extends this** to work in ALL languages with the same API.

## ✨ Features

- ✅ String-to-string compression
- ✅ Base64 encoding
- ✅ URI-safe encoding
- ✅ UTF-16 support
- ✅ LocalStorage optimization
- ✅ Small output size
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { compressToBase64, decompressFromBase64 } from './elide-lz-string.ts';

const compressed = compressToBase64("Long string...");
const original = decompressFromBase64(compressed);

// URI-safe for URLs
import { compressToEncodedURIComponent } from './elide-lz-string.ts';
const uriSafe = compressToEncodedURIComponent("Data for URL");
```

### Python
```python
from elide import require
lz_string = require('./elide-lz-string.ts')

compressed = lz_string.compressToBase64("Long string...")
original = lz_string.decompressFromBase64(compressed)
```

## 💡 Real-World Use Cases

### LocalStorage Compression
```typescript
import { compressToBase64, decompressFromBase64 } from './elide-lz-string.ts';

// Save compressed data
const data = { user: {...}, preferences: {...}, history: [...] };
const compressed = compressToBase64(JSON.stringify(data));
localStorage.setItem('app-data', compressed);

// Load and decompress
const stored = localStorage.getItem('app-data');
const original = JSON.parse(decompressFromBase64(stored || ''));
```

### URL Parameters
```typescript
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from './elide-lz-string.ts';

// Compress large state for URL
const state = { filters: {...}, sort: {...}, view: {...} };
const compressed = compressToEncodedURIComponent(JSON.stringify(state));
window.location.href = `/app?state=${compressed}`;

// Decompress from URL
const params = new URLSearchParams(window.location.search);
const state = JSON.parse(decompressFromEncodedURIComponent(params.get('state') || ''));
```

## 📖 API Reference

### `compressToBase64(input)`
Compress string to base64

### `decompressFromBase64(input)`
Decompress from base64

### `compressToEncodedURIComponent(input)`
Compress to URI-safe string

### `decompressFromEncodedURIComponent(input)`
Decompress from URI-safe string

## 📝 Package Stats

- **npm downloads**: ~5M/week
- **Use case**: String compression for browsers
- **Elide advantage**: Works in all languages
- **Polyglot score**: 45/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
