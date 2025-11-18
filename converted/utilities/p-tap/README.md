# Elide P-Tap

Pure TypeScript implementation of `p-tap`.

## Original Package

- **npm**: `p-tap`
- **Downloads**: ~8M/week

## Usage

```typescript
import pTap from './elide-p-tap.ts';

const result = await pTap(
  fetchData(),
  (data) => console.log('Fetched:', data)
);
```
