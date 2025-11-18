# GeoJSON Validation - Elide Polyglot Showcase

> **One GeoJSON validator for ALL languages** - TypeScript, Python, Ruby, and Java

Validate GeoJSON objects against the specification.

## Features

- Validate Feature/FeatureCollection
- Check coordinate validity
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import { valid } from './elide-geojson-validation.ts';

const feature = { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} };
console.log(valid(feature)); // true
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
