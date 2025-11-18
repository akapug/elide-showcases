# Shapefile - Elide Polyglot Showcase

> **One shapefile streamer for ALL languages** - TypeScript, Python, Ruby, and Java

Stream-based shapefile parsing for large files.

## Quick Start

```typescript
import { open } from './elide-shapefile.ts';

const source = await open('data.shp');
for await (const feature of source.read()) {
  console.log(feature);
}
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
