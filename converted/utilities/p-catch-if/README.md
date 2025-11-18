# Elide P-Catch-If

Pure TypeScript implementation of `p-catch-if`.

## Original Package

- **npm**: `p-catch-if`
- **Downloads**: ~2M/week

## Usage

```typescript
import pCatchIf from './elide-p-catch-if.ts';

const result = await pCatchIf(
  fetchData(),
  (error) => error.code === 'ENOTFOUND',
  () => ({ fallback: true })
);
```
