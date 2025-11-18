# Elide Promise-Retry

Pure TypeScript implementation of `promise-retry`.

## Original Package

- **npm**: `promise-retry`
- **Downloads**: ~15M/week

## Usage

```typescript
import promiseRetry from './elide-promise-retry.ts';

const result = await promiseRetry(async (retry, attemptNumber) => {
  try {
    return await fetchData();
  } catch (error) {
    if (shouldRetry(error)) {
      retry(error);
    }
    throw error;
  }
}, {
  retries: 5,
  factor: 2,
  minTimeout: 1000,
});
```
