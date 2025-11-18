# Elide P-Debounce

Pure TypeScript implementation of `p-debounce`.

## Original Package

- **npm**: `p-debounce`
- **Downloads**: ~2M/week

## Usage

```typescript
import pDebounce from './elide-p-debounce.ts';

const debouncedSearch = pDebounce(async (query: string) => {
  return searchAPI(query);
}, 300);

await debouncedSearch('test');
```
