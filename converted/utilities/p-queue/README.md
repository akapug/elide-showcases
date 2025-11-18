# Elide P-Queue

Pure TypeScript implementation of `p-queue` for managing promise execution with priority and concurrency control.

## Features

- Promise queue with concurrency control
- Priority support
- Pause and resume functionality
- Timeout support
- Event monitoring (onIdle, onEmpty)
- Zero dependencies
- Full TypeScript support

## Original Package

- **npm**: `p-queue`
- **Downloads**: ~15M/week
- **Use case**: Promise queue with advanced features

## Polyglot Benefits

- Works in Browser, Node.js, Deno, Bun, and Elide
- Zero dependencies - pure TypeScript
- Type-safe with full TypeScript support
- Tree-shakeable and optimized for modern bundlers

## Usage

```typescript
import PQueue from './elide-p-queue.ts';

const queue = new PQueue({ concurrency: 2 });

// Add promises to the queue
await queue.add(() => fetchData(1));
await queue.add(() => fetchData(2), { priority: 1 });

// Add multiple promises
const results = await queue.addAll([
  () => fetchData(3),
  () => fetchData(4),
  () => fetchData(5),
]);

// Pause and resume
queue.pause();
queue.start();

// Wait for queue to be empty or idle
await queue.onEmpty();
await queue.onIdle();

// Clear the queue
queue.clear();
```

## API

### new PQueue(options?)

Creates a new queue instance.

#### options

Type: `object`

##### concurrency

Type: `number`
Default: `Infinity`

The maximum number of promises to run concurrently.

##### timeout

Type: `number`
Default: `undefined`

Per-operation timeout in milliseconds.

##### autoStart

Type: `boolean`
Default: `true`

Whether to start the queue automatically.

### queue.add(fn, options?)

Adds a promise-returning function to the queue.

Returns a promise that resolves when the function is executed.

### queue.addAll(fns, options?)

Adds multiple promise-returning functions to the queue.

### queue.pause()

Pauses the queue.

### queue.start()

Starts or resumes the queue.

### queue.clear()

Clears the queue.

### queue.onIdle()

Returns a promise that resolves when the queue becomes idle (empty and no pending promises).

### queue.onEmpty()

Returns a promise that resolves when the queue becomes empty.

### queue.size

Type: `number`

The number of promises in the queue.

### queue.pendingCount

Type: `number`

The number of promises currently running.
