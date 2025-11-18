# Terraformer - Elide Polyglot Showcase

> **One geo format converter for ALL languages** - TypeScript, Python, Ruby, and Java

Convert between GeoJSON, WKT, and other geographic formats.

## Quick Start

```typescript
import { parse, convert } from './elide-terraformer.ts';

const geojson = parse("POINT(-74 40)");
const wkt = convert({ type: 'Point', coordinates: [-74, 40] });
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
