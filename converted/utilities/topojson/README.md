# TopoJSON - Elide Polyglot Showcase

> **One TopoJSON library for ALL languages** - TypeScript, Python, Ruby, and Java

Extension of GeoJSON that eliminates redundancy for compact file sizes.

## Features

- Convert GeoJSON to TopoJSON
- Convert TopoJSON to GeoJSON
- Arc de-duplication
- Quantization
- Topology preservation
- Zero dependencies
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { topology, feature, quantize } from './elide-topojson.ts';

const geojson = {
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [[...]] },
  properties: { name: 'NYC' }
};

const topo = topology({ nyc: geojson });
const recovered = feature(topo, 'nyc');
```

## Documentation

Run the demo:

```bash
elide run elide-topojson.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/topojson)
- [TopoJSON Specification](https://github.com/topojson/topojson-specification)

---

**Built with ❤️ for the Elide Polyglot Runtime**
