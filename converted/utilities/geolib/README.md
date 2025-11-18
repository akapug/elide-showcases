# Geolib - Elide Polyglot Showcase

> **One geographic calculation library for ALL languages** - TypeScript, Python, Ruby, and Java

Library for geographic calculations like distance, bearing, center points, and nearest location.

## Features

- Distance calculations (Haversine formula)
- Bearing and compass direction
- Center point calculation
- Bounding box generation
- Point in circle checks
- Find nearest location
- Order by distance
- Zero dependencies
- **~300K+ downloads/week on npm**

## Quick Start

```typescript
import { getDistance, getBearing, findNearest } from './elide-geolib.ts';

const nyc = { latitude: 40.7128, longitude: -74.0060 };
const london = { latitude: 51.5074, longitude: -0.1278 };

console.log(`Distance: ${getDistance(nyc, london)} meters`);
console.log(`Bearing: ${getBearing(nyc, london)}°`);

const stores = [/* array of coordinates */];
const nearest = findNearest(nyc, stores);
```

## Documentation

Run the demo:

```bash
elide run elide-geolib.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/geolib)
- [Geolib Documentation](https://github.com/manuelbieh/geolib)

---

**Built with ❤️ for the Elide Polyglot Runtime**
