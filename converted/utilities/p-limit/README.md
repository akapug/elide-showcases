# Elide P-Limit

Pure TypeScript implementation of `p-limit` for controlling promise concurrency.

## Features

- Limit concurrent promise execution
- Queue management
- Active count tracking
- Pending count tracking
- Zero dependencies
- Full TypeScript support

## Original Package

- **npm**: `p-limit`
- **Downloads**: ~80M/week
- **Use case**: Promise concurrency limiter

## Polyglot Benefits

- Works in Browser, Node.js, Deno, Bun, and Elide
- Zero dependencies - pure TypeScript
- Type-safe with full TypeScript support
- Tree-shakeable and optimized for modern bundlers
- Simple and focused API

## Usage

```typescript
import pLimit from './elide-p-limit.ts';

const limit = pLimit(2);

const input = [
  limit(() => fetchData(1)),
  limit(() => fetchData(2)),
  limit(() => fetchData(3)),
  limit(() => fetchData(4)),
  limit(() => fetchData(5)),
];

// Only 2 promises run at a time
const results = await Promise.all(input);

// Check active and pending counts
console.log(limit.activeCount); // 0
console.log(limit.pendingCount); // 0

// Clear the queue if needed
limit.clearQueue();
```

## API

### pLimit(concurrency)

Returns a `limit` function.

#### concurrency

Type: `number`

The maximum number of promises to run concurrently.

#### limit(fn)

Returns a promise that resolves when the function is called.

##### fn

Type: `() => Promise<T>`

The function to limit. Must return a promise.

### limit.activeCount

Type: `number`

The number of promises that are currently running.

### limit.pendingCount

Type: `number`

The number of promises that are waiting to run.

### limit.clearQueue()

Clears the queue of pending promises.
