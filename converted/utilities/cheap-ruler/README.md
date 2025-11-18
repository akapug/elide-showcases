# Cheap Ruler - Elide Polyglot Showcase

> **One fast geographic calculation library for ALL languages** - TypeScript, Python, Ruby, and Java

Fast approximations for geographic calculations using flat projections - 10x faster than Haversine.

## Features

- Fast distance calculations
- Bearing and destination
- Line distance and area
- Point along line
- Buffer calculations
- Multiple units (km, miles, meters)
- Zero dependencies
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import CheapRuler from './elide-cheap-ruler.ts';

const ruler = new CheapRuler(40.7128); // latitude for projection
const distance = ruler.distance([-74.006, 40.7128], [-73.9855, 40.7580]);
console.log(`Distance: ${distance} km`);
```

## Documentation

Run the demo:

```bash
elide run elide-cheap-ruler.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/cheap-ruler)

---

**Built with ❤️ for the Elide Polyglot Runtime**
