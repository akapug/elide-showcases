# Elide Async

Pure TypeScript implementation of the popular `async` library for async control flow patterns.

## Features

- Series, parallel, and waterfall execution
- Collection methods (map, filter, reduce)
- Control flow utilities (whilst, until, times)
- Queue with concurrency control
- Retry utilities
- Zero dependencies
- Full TypeScript support

## Original Package

- **npm**: `async`
- **Downloads**: ~25M/week
- **Use case**: Async utilities and control flow

## Polyglot Benefits

- Works in Browser, Node.js, Deno, Bun, and Elide
- Zero dependencies - pure TypeScript
- Type-safe with full TypeScript support
- Tree-shakeable and optimized for modern bundlers
- Native Promise support (no callbacks required)

## Usage

```typescript
import { series, parallel, map, queue } from './elide-async.ts';

// Run tasks in series
const results = await series([
  async () => fetchData(1),
  async () => fetchData(2),
  async () => fetchData(3),
]);

// Run tasks in parallel
const results = await parallel([
  async () => fetchData(1),
  async () => fetchData(2),
  async () => fetchData(3),
]);

// Map with concurrency limit
const results = await mapLimit(
  [1, 2, 3, 4, 5],
  2,
  async (id) => fetchData(id)
);

// Create a queue with concurrency
const q = queue(async (task) => {
  return processTask(task);
}, 3);

await q.push({ id: 1 });
await q.push({ id: 2 });
```

## API

### Control Flow

- `series<T>(tasks: Array<() => Promise<T>>): Promise<T[]>` - Run tasks in series
- `parallel<T>(tasks: Array<() => Promise<T>>): Promise<T[]>` - Run tasks in parallel
- `parallelLimit<T>(tasks, limit): Promise<T[]>` - Run tasks with concurrency limit
- `waterfall<T>(tasks): Promise<T>` - Run tasks where each consumes the previous result

### Collections

- `map<T, R>(arr, iterator): Promise<R[]>` - Map in parallel
- `mapSeries<T, R>(arr, iterator): Promise<R[]>` - Map in series
- `mapLimit<T, R>(arr, limit, iterator): Promise<R[]>` - Map with concurrency limit
- `filter<T>(arr, iterator): Promise<T[]>` - Filter in parallel
- `filterSeries<T>(arr, iterator): Promise<T[]>` - Filter in series
- `reduce<T, R>(arr, memo, iterator): Promise<R>` - Reduce array

### Iteration

- `each<T>(arr, iterator): Promise<void>` - Iterate in parallel
- `eachSeries<T>(arr, iterator): Promise<void>` - Iterate in series
- `eachLimit<T>(arr, limit, iterator): Promise<void>` - Iterate with concurrency limit

### Control

- `whilst(test, fn): Promise<void>` - Repeat while test is true
- `until(test, fn): Promise<void>` - Repeat until test is true
- `times<T>(n, iterator): Promise<T[]>` - Call function n times in series
- `timesPar<T>(n, iterator): Promise<T[]>` - Call function n times in parallel
- `retry<T>(times, fn): Promise<T>` - Retry function on failure

### Queue

- `queue<T>(worker, concurrency): Queue<T>` - Create a queue with concurrency control
- `Queue.push(task): Promise<T>` - Add task to queue
- `Queue.length(): number` - Get queue length
- `Queue.idle(): boolean` - Check if queue is idle
