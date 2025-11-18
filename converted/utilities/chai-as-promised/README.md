# chai-as-promised - Promise Assertions

**Pure TypeScript implementation of chai-as-promised for Elide.**

Based on [chai-as-promised](https://www.npmjs.com/package/chai-as-promised) (~10M+ downloads/week)

## Features

- Promise assertions
- Async/await support
- Rejection testing
- Fulfillment testing
- Zero dependencies

## Installation

```bash
elide install @elide/chai-as-promised
```

## Usage

```typescript
import { expectPromise } from './elide-chai-as-promised.ts';

// Fulfilled promises
await expectPromise(promise).toBeFulfilled();
await expectPromise(promise).toEventuallyEqual(42);

// Rejected promises
await expectPromise(promise).toBeRejected();
await expectPromise(promise).toBeRejectedWith('error message');

// Property checks
await expectPromise(promise).toEventuallyHaveProperty('key', 'value');
await expectPromise(promise).toEventuallyContain(item);
```

## API Reference

- `toBeFulfilled()` - Assert promise resolves
- `toBeRejected()` - Assert promise rejects
- `toBeRejectedWith(pattern)` - Assert rejection message
- `toEventuallyEqual(value)` - Assert resolved value equals
- `toEventuallyBe(value)` - Assert resolved value is
- `toEventuallyHaveProperty(key, value?)` - Assert property
- `toEventuallyContain(item)` - Assert contains

## Performance

- **10M+ downloads/week** - Popular async library

## License

MIT
