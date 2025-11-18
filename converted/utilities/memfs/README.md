# Memfs - Memory Filesystem

In-memory filesystem compatible with Node's fs API.

Based on [memfs](https://www.npmjs.com/package/memfs) (~1M+ downloads/week)

## Features

- ✅ Full fs API compatibility
- ✅ In-memory storage
- ✅ Fast operations
- ✅ Zero dependencies

## Quick Start

```typescript
import { Volume, createFsFromVolume } from './elide-memfs.ts';

const vol = new Volume();
vol.writeFileSync('/test.txt', 'Hello');
console.log(vol.readFileSync('/test.txt', 'utf8'));

const fs = createFsFromVolume(vol);
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
