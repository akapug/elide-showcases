# Elide P-Race

Pure TypeScript implementation of `p-race`.

## Original Package

- **npm**: `p-race`
- **Downloads**: ~3M/week

## Usage

```typescript
import pRace from './elide-p-race.ts';

const fastest = await pRace([
  fetchData(1),
  fetchData(2),
  fetchData(3),
]);
```
