# RFC6902 - JSON Patch Implementation

Complete RFC 6902 (JSON Patch) implementation on Elide.

## Quick Start

```typescript
import { createPatch, applyPatch } from './elide-rfc6902.ts';

const patches = createPatch(obj1, obj2);
const result = applyPatch(obj1, patches);
```

Based on https://www.npmjs.com/package/rfc6902 (~100K+ downloads/week)
