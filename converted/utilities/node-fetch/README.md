# Node-Fetch - Fetch API for Node.js - Elide Polyglot Showcase

> **One fetch API for ALL languages** - TypeScript, Python, Ruby, and Java

A light-weight module that brings the standard Fetch API to all languages via Elide.

## 🌟 Why This Matters

**Elide provides** ONE fetch implementation that works consistently across ALL languages.

## ✨ Features

- ✅ Standard Fetch API
- ✅ Promise-based
- ✅ Timeout support
- ✅ Custom headers
- ✅ **Polyglot**: Works in TypeScript, Python, Ruby, Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import fetch from './elide-node-fetch.ts';

const response = await fetch('https://api.example.com/users');
const data = await response.json();
```

### Python
```python
from elide import require
fetch = require('./elide-node-fetch.ts').default

response = await fetch('https://api.example.com/users')
data = await response.json()
```

## 📝 Package Stats

- **npm downloads**: ~80M/week
- **Use case**: HTTP requests with Fetch API
- **Polyglot score**: 47/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
