# Elide Delay

Pure TypeScript implementation of `delay`.

## Original Package

- **npm**: `delay`
- **Downloads**: ~15M/week

## Usage

```typescript
import delay from './elide-delay.ts';

await delay(1000);
await delay(1000, { value: 'result' });

const delayedPromise = delay(5000);
delayedPromise.clear(); // Cancel
```
