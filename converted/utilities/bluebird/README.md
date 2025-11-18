# Elide Bluebird

Pure TypeScript implementation of the popular `bluebird` promise library.

## Features

- Promise utilities and helpers
- Promisification of callback-based APIs
- Collection methods with concurrency control
- Error handling and recovery
- Promise inspection and monitoring
- Zero dependencies
- Full TypeScript support

## Original Package

- **npm**: `bluebird`
- **Downloads**: ~20M/week
- **Use case**: Feature-rich promise library

## Polyglot Benefits

- Works in Browser, Node.js, Deno, Bun, and Elide
- Zero dependencies - pure TypeScript
- Type-safe with full TypeScript support
- Tree-shakeable and optimized for modern bundlers
- Native Promise-compatible

## Usage

```typescript
import { map, promisify, delay, props } from './elide-bluebird.ts';

// Map with concurrency
const results = await map(
  [1, 2, 3, 4, 5],
  async (id) => fetchData(id),
  { concurrency: 2 }
);

// Promisify callback-based function
const readFileAsync = promisify(fs.readFile);
const content = await readFileAsync('file.txt', 'utf8');

// Delay execution
await delay(1000);
const value = await delay(1000, 'result');

// Resolve object properties
const result = await props({
  users: fetchUsers(),
  posts: fetchPosts(),
  comments: fetchComments(),
});
```

## API

### Promisification

- `promisify<T>(fn, context?): (...args) => Promise<T>` - Promisify a callback function
- `promisifyAll<T>(obj): T` - Promisify all methods of an object

### Collections

- `map<T, R>(arr, mapper, options?): Promise<R[]>` - Map with optional concurrency
- `mapSeries<T, R>(arr, mapper): Promise<R[]>` - Map in series
- `filter<T>(arr, predicate, options?): Promise<T[]>` - Filter with optional concurrency
- `reduce<T, R>(arr, reducer, initial): Promise<R>` - Reduce array
- `each<T>(arr, iterator, options?): Promise<void>` - Iterate with optional concurrency

### Utilities

- `delay<T>(ms, value?): Promise<T | undefined>` - Delay execution
- `timeout<T>(promise, ms, message?): Promise<T>` - Add timeout to promise
- `settle<T>(promises): Promise<Inspector[]>` - Settle all promises
- `props<T>(obj): Promise<T>` - Resolve object properties
- `tap<T>(promise, handler): Promise<T>` - Tap into promise chain
- `retry<T>(fn, options?): Promise<T>` - Retry function on failure

### Control Flow

- `any<T>(promises): Promise<T>` - First resolved promise
- `some<T>(promises, count): Promise<T[]>` - First N resolved promises
- `resolve<T>(value): Promise<T>` - Create resolved promise
- `reject(reason): Promise<never>` - Create rejected promise
- `defer<T>(): Deferred<T>` - Create deferred promise

### Class

- `BluebirdPromise<T>` - Promise subclass with method chaining
  - `.delay(ms): BluebirdPromise<T>`
  - `.timeout(ms, message?): BluebirdPromise<T>`
  - `.tap(handler): BluebirdPromise<T>`
