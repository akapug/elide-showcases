# Geohash - Elide Polyglot Showcase

> **One geohash encoding library for ALL languages** - TypeScript, Python, Ruby, and Java

Encode and decode geographic coordinates to geohash strings for spatial indexing.

## Features

- Encode lat/lon to geohash
- Decode geohash to lat/lon
- Bounding box calculation
- Neighbor finding
- Multiple precision levels (1-12)
- Zero dependencies
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import { encode, decode, neighbors } from './elide-geohash.ts';

const hash = encode(40.7128, -74.0060, 9);
console.log(`Geohash: ${hash}`);

const coords = decode(hash);
console.log(`Lat/Lon: ${coords.latitude}, ${coords.longitude}`);

const nbrs = neighbors(hash);
console.log(`North neighbor: ${nbrs.n}`);
```

## Documentation

Run the demo:

```bash
elide run elide-geohash.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/geohash)
- [Geohash Wikipedia](https://en.wikipedia.org/wiki/Geohash)

---

**Built with ❤️ for the Elide Polyglot Runtime**
