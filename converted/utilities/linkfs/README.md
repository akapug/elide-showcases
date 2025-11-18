# LinkFS - Linked Filesystem

Link filesystem directories together.

Based on [linkfs](https://www.npmjs.com/package/linkfs) (~500K+ downloads/week)

## Features

- ✅ Link directories
- ✅ Virtual filesystem
- ✅ Zero dependencies

## Quick Start

```typescript
import LinkFS from './elide-linkfs.ts';

const lfs = new LinkFS(baseFs);
lfs.link('/virtual', '/real');
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
