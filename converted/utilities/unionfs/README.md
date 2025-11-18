# UnionFS - Union Filesystem

Merge multiple filesystem volumes into one.

Based on [unionfs](https://www.npmjs.com/package/unionfs) (~500K+ downloads/week)

## Features

- ✅ Merge multiple filesystems
- ✅ Layer filesystem volumes
- ✅ Zero dependencies

## Quick Start

```typescript
import UnionFS from './elide-unionfs.ts';

const ufs = new UnionFS();
ufs.use(fs1, fs2, fs3);
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
