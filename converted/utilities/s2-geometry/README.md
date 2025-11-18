# S2 Geometry - Elide Polyglot Showcase

> **One S2 geometry library for ALL languages** - TypeScript, Python, Ruby, and Java

Google's S2 geometry library for spatial indexing.

## Quick Start

```typescript
import S2 from './elide-s2-geometry.ts';

const key = S2.latLngToKey(40.7128, -74.0060, 15);
const coords = S2.keyToLatLng(key);
const neighbors = S2.neighbors(key);
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
