# Elide P-Some

Pure TypeScript implementation of `p-some`.

## Original Package

- **npm**: `p-some`
- **Downloads**: ~3M/week

## Usage

```typescript
import pSome from './elide-p-some.ts';

const first3 = await pSome([
  fetchData(1),
  fetchData(2),
  fetchData(3),
  fetchData(4),
  fetchData(5),
], 3);
```
