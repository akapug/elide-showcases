# Elide P-Timeout

Pure TypeScript implementation of `p-timeout` for adding timeouts to promises.

## Features

- Add timeout to any promise
- Custom timeout error messages
- Fallback values on timeout
- Zero dependencies
- Full TypeScript support

## Original Package

- **npm**: `p-timeout`
- **Downloads**: ~15M/week
- **Use case**: Promise timeout wrapper

## Polyglot Benefits

- Works in Browser, Node.js, Deno, Bun, and Elide
- Zero dependencies - pure TypeScript
- Type-safe with full TypeScript support

## Usage

```typescript
import pTimeout, { TimeoutError } from './elide-p-timeout.ts';

// Simple timeout
try {
  const result = await pTimeout(fetchData(), 5000);
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log('Request timed out');
  }
}

// With custom message
const result = await pTimeout(
  fetchData(),
  5000,
  { message: 'Data fetch timed out after 5 seconds' }
);

// With fallback
const result = await pTimeout(
  fetchData(),
  5000,
  { fallback: () => ({ default: 'data' }) }
);
```

## API

### pTimeout(promise, ms, options?)

#### promise

Type: `Promise<T>`

The promise to add timeout to.

#### ms

Type: `number`

Timeout in milliseconds.

#### options

Type: `object`

##### message

Type: `string`

Custom timeout error message.

##### fallback

Type: `() => T | Promise<T>`

Fallback function to call on timeout.

### TimeoutError

Error class thrown on timeout.
