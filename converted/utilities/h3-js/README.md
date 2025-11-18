# H3-js - Elide Polyglot Showcase

> **One hexagonal geospatial indexing library for ALL languages** - TypeScript, Python, Ruby, and Java

Uber's H3 system for hexagonal grid spatial indexing and analysis.

## Features

- Lat/lon to H3 index conversion
- Hexagonal grid cells
- Multiple resolutions (0-15)
- K-ring neighbors
- Distance calculation
- Polygon coverage
- Zero dependencies
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { geoToH3, h3ToGeo, kRing } from './elide-h3-js.ts';

const h3Index = geoToH3(40.7128, -74.0060, 9);
console.log(`H3 Index: ${h3Index}`);

const coords = h3ToGeo(h3Index);
const neighbors = kRing(h3Index, 1);
console.log(`Neighbors: ${neighbors.length}`);
```

## Documentation

Run the demo:

```bash
elide run elide-h3-js.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/h3-js)
- [H3 Documentation](https://h3geo.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
