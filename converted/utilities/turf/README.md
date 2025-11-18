# Turf - Elide Polyglot Showcase

> **One geospatial analysis library for ALL languages** - TypeScript, Python, Ruby, and Java

Advanced geospatial analysis for distance, area, buffers, and spatial queries.

## Features

- Distance calculations (Haversine formula)
- Area and length measurements
- Centroid and bounding box
- Buffer generation
- Point-in-polygon tests
- GeoJSON utilities
- Zero dependencies
- **~300K+ downloads/week on npm**

## Quick Start

```typescript
import { point, distance, buffer, booleanPointInPolygon } from './elide-turf.ts';

const nyc = point([-74.006, 40.7128]);
const boston = point([-71.0589, 42.3601]);

console.log(`Distance: ${distance(nyc, boston)} km`);

const deliveryZone = buffer(nyc, 5, { units: 'kilometers' });
const customer = point([-74.01, 40.72]);
console.log(`Can deliver: ${booleanPointInPolygon(customer, deliveryZone)}`);
```

## Documentation

Run the demo:

```bash
elide run elide-turf.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/@turf/turf)
- [Turf.js Documentation](https://turfjs.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
