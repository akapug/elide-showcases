# Microdiff - Tiny Object Diffing

A tiny (1KB) object diffing library on Elide.

## Features

- Ultra small (1KB minified)
- Fast performance
- Simple API
- Deep object support
- Zero dependencies

## Quick Start

```typescript
import diff from './elide-microdiff.ts';

const diffs = diff(obj1, obj2);
diffs.forEach(d => {
  console.log(`${d.type} at ${d.path.join('.')}`);
});
```

## Polyglot Examples

```python
# Python
from elide_microdiff import diff
diffs = diff(obj1, obj2)
```

Based on https://www.npmjs.com/package/microdiff (~100K+ downloads/week)
