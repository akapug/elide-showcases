# seedrandom - Seeded Random Number Generator

Seedable random number generator for reproducible randomness.

**POLYGLOT SHOWCASE**: Deterministic random in ANY language on Elide!

## Quick Start

```typescript
import seedrandom, { SeedRandom } from './elide-seedrandom.ts';

const rng = new SeedRandom("my-seed");
console.log(rng.next()); // Always same result with same seed
```

## Stats

- **300K+ downloads/week** on npm
- Reproducible randomness
