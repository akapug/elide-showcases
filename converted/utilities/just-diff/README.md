# Just Diff - Minimal Object Diffing

A minimal, fast object diffing library on Elide.

## Features

- Tiny size (minimal code)
- Fast diffing algorithm
- JSON Pointer paths
- Array/object support
- Zero dependencies

## Quick Start

```typescript
import diff from './elide-just-diff.ts';

const diffs = diff(obj1, obj2);
console.log(diffs);
// [{ op: 'replace', path: ['b'], value: 3 }, ...]
```

## Polyglot Examples

```python
# Python
from elide_just_diff import diff
diffs = diff(obj1, obj2)
```

Based on https://www.npmjs.com/package/just-diff (~100K+ downloads/week)
