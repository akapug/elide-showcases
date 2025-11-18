# Elide P-Any

Pure TypeScript implementation of `p-any`.

## Original Package

- **npm**: `p-any`
- **Downloads**: ~5M/week

## Usage

```typescript
import pAny from './elide-p-any.ts';

const first = await pAny([
  fetchData(1),
  fetchData(2),
  fetchData(3),
]);
```
