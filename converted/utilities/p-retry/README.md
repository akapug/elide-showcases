# Elide P-Retry

Pure TypeScript implementation of `p-retry` for retrying failed promises with backoff.

## Features

- Retry failed promises
- Configurable retry count
- Exponential backoff support
- Custom retry conditions
- Abort mechanism
- Zero dependencies
- Full TypeScript support

## Original Package

- **npm**: `p-retry`
- **Downloads**: ~15M/week
- **Use case**: Promise retry with backoff

## Polyglot Benefits

- Works in Browser, Node.js, Deno, Bun, and Elide
- Zero dependencies - pure TypeScript
- Type-safe with full TypeScript support

## Usage

```typescript
import pRetry, { AbortError } from './elide-p-retry.ts';

// Simple retry
const result = await pRetry(async () => {
  return fetchData();
}, {
  retries: 5
});

// With backoff
const result = await pRetry(async () => {
  return fetchData();
}, {
  retries: 5,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 10000,
  randomize: true
});

// With callback
const result = await pRetry(async () => {
  return fetchData();
}, {
  retries: 5,
  onFailedAttempt: (error) => {
    console.log('Attempt failed:', error);
  }
});

// Abort on specific error
await pRetry(async () => {
  const response = await fetch('/api');
  if (response.status === 404) {
    throw new AbortError('Not found');
  }
  return response;
}, { retries: 5 });
```

## API

### pRetry(fn, options?)

#### fn

Type: `(attemptNumber: number) => Promise<T>`

The function to retry.

#### options

Type: `object`

##### retries

Type: `number`
Default: `3`

The maximum number of retry attempts.

##### factor

Type: `number`
Default: `2`

The exponential backoff factor.

##### minTimeout

Type: `number`
Default: `1000`

The minimum delay in milliseconds.

##### maxTimeout

Type: `number`
Default: `Infinity`

The maximum delay in milliseconds.

##### randomize

Type: `boolean`
Default: `false`

Whether to randomize the delay.

##### onFailedAttempt

Type: `(error: any) => void | Promise<void>`

Callback on failed attempt.

### AbortError

Error class to abort retries.
