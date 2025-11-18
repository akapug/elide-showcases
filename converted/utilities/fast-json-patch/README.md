# Fast JSON Patch - RFC 6902 Implementation

Fast implementation of JSON Patch (RFC 6902) on Elide.

## Features

- RFC 6902 compliant
- Fast performance
- Apply/generate patches
- Zero dependencies

## Quick Start

```typescript
import { applyPatch, compare } from './elide-fast-json-patch.ts';

const patch = [{ op: 'replace', path: '/name', value: 'Bob' }];
const result = applyPatch(doc, patch);
const patches = compare(obj1, obj2);
```

Based on https://www.npmjs.com/package/fast-json-patch (~500K+ downloads/week)
