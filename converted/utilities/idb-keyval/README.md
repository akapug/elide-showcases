# IDB-Keyval - Elide Polyglot Showcase

> **One key-value store for ALL languages** - TypeScript, Python, Ruby, and Java

Super-simple IndexedDB key-value store with only 600 bytes footprint.

## Features

- Simple get/set/del API
- Only 600 bytes minified
- Promise-based
- No setup required
- Works in all browsers
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import { get, set, del } from './elide-idb-keyval.ts';

// Store data
await set('username', 'alice');
await set('user', { name: 'Alice', age: 30 });

// Retrieve data
const name = await get('username'); // 'alice'
const user = await get('user'); // { name: 'Alice', age: 30 }

// Delete data
await del('username');
```

## Documentation

Run the demo:

```bash
elide run elide-idb-keyval.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/idb-keyval)
- [GitHub Repository](https://github.com/jakearchibald/idb-keyval)

---

**Built with ❤️ for the Elide Polyglot Runtime**
