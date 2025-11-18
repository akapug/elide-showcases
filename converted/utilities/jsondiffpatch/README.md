# JSONDiffPatch - Diff and Patch for JSON

Diff and patch JSON documents with detailed tracking on Elide.

## Quick Start

```typescript
import { diff, patch } from './elide-jsondiffpatch.ts';

const delta = diff(obj1, obj2);
const result = patch(obj1, delta);
```

Based on https://www.npmjs.com/package/jsondiffpatch (~100K+ downloads/week)
