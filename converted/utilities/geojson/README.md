# GeoJSON - Elide Polyglot Showcase

> **One GeoJSON utility library for ALL languages** - TypeScript, Python, Ruby, and Java

Utilities for creating, parsing, and validating GeoJSON data.

## Features

- Create Point, LineString, Polygon features
- Parse data into GeoJSON
- Validate GeoJSON structure
- Feature collections
- Property management
- Zero dependencies
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import { point, parse, featureCollection } from './elide-geojson.ts';

const nyc = point([-74.006, 40.7128], { name: "NYC", pop: 8336817 });

const cities = [
  { name: "NYC", lon: -74.006, lat: 40.7128 },
  { name: "LA", lon: -118.2437, lat: 34.0522 }
];

const geoJSON = parse(cities, { Point: ['lon', 'lat'] });
console.log(geoJSON);
```

## Documentation

Run the demo:

```bash
elide run elide-geojson.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/geojson)
- [GeoJSON Specification](https://geojson.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
