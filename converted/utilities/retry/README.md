# Elide Retry

Pure TypeScript implementation of `retry`.

## Original Package

- **npm**: `retry`
- **Downloads**: ~30M/week

## Usage

```typescript
import retry, { RetryOperation } from './elide-retry.ts';

// Simple retry
const result = await retry(
  { retries: 5, minTimeout: 1000 },
  async () => fetchData()
);

// Using RetryOperation
const operation = new RetryOperation({ retries: 5 });
const result = await operation.attempt(async () => fetchData());
```
