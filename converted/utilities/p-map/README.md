# Elide P-Map

Pure TypeScript implementation of `p-map` for mapping over arrays with concurrency control.

## Features

- Map over arrays with concurrency limit
- Stop on error support
- Works with any iterable
- Zero dependencies
- Full TypeScript support

## Original Package

- **npm**: `p-map`
- **Downloads**: ~30M/week
- **Use case**: Concurrent array mapping

## Polyglot Benefits

- Works in Browser, Node.js, Deno, Bun, and Elide
- Zero dependencies - pure TypeScript
- Type-safe with full TypeScript support
- Tree-shakeable

## Usage

```typescript
import pMap from './elide-p-map.ts';

const ids = [1, 2, 3, 4, 5];

const results = await pMap(ids, async (id) => {
  return fetchData(id);
}, { concurrency: 2 });

console.log(results);
```

## API

### pMap(input, mapper, options?)

Returns a promise that resolves when all mapped promises are resolved.

#### input

Type: `Iterable<T>`

The iterable to map over.

#### mapper

Type: `(item: T, index: number) => Promise<R> | R`

The mapper function.

#### options

Type: `object`

##### concurrency

Type: `number`
Default: `Infinity`

The maximum number of promises to run concurrently.

##### stopOnError

Type: `boolean`
Default: `true`

Whether to stop on the first error.
