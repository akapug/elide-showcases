# Haversine - Elide Polyglot Showcase

> **One distance calculation library for ALL languages** - TypeScript, Python, Ruby, and Java

Calculate distance between two points on Earth using the Haversine formula.

## Features

- Accurate great circle distance
- Multiple units (km, miles, meters, nautical miles)
- Flexible coordinate formats
- Within radius checks
- Threshold option
- Zero dependencies
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import haversine, { distanceInKm, isWithinRadius } from './elide-haversine.ts';

const nyc = { latitude: 40.7128, longitude: -74.0060 };
const la = { latitude: 34.0522, longitude: -118.2437 };

console.log(`Distance: ${haversine(nyc, la)} km`);
console.log(`In miles: ${haversine(nyc, la, { unit: 'mile' })} miles`);
console.log(`Within 5000km: ${isWithinRadius(nyc, la, 5000)}`);
```

## Documentation

Run the demo:

```bash
elide run elide-haversine.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/haversine)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

---

**Built with ❤️ for the Elide Polyglot Runtime**
