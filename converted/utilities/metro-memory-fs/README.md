# Metro Memory FS - Metro Filesystem

Memory filesystem for Metro bundler.

Based on [metro-memory-fs](https://www.npmjs.com/package/metro-memory-fs) (~500K+ downloads/week)

## Features

- ✅ Metro-compatible filesystem
- ✅ In-memory storage
- ✅ Zero dependencies

## Quick Start

```typescript
import MetroMemoryFS from './elide-metro-memory-fs.ts';

const fs = new MetroMemoryFS();
fs.writeFileSync('/bundle.js', 'code');
console.log(fs.readFileSync('/bundle.js'));
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
