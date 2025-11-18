# Elide Promise-Queue

Pure TypeScript implementation of `promise-queue`.

## Original Package

- **npm**: `promise-queue`
- **Downloads**: ~3M/week

## Usage

```typescript
import PromiseQueue from './elide-promise-queue.ts';

const queue = new PromiseQueue(2, 10);

await queue.add(() => fetchData(1));
await queue.add(() => fetchData(2));

console.log(queue.getQueueLength());
console.log(queue.getPendingLength());
```
