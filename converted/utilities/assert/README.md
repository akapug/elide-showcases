# assert - Node.js Assert Module

**Pure TypeScript implementation of Node.js assert for Elide.**

Based on [Node.js assert](https://nodejs.org/api/assert.html) (~50M+ downloads/week)

## Features

- Basic assertions
- Equality checking
- Deep equality
- Exception testing
- Zero dependencies

## Installation

```bash
elide install @elide/assert
```

## Usage

```typescript
import assert from './elide-assert.ts';

assert(true);
assert.equal(2 + 2, 4);
assert.strictEqual('hello', 'hello');
assert.deepEqual({ a: 1 }, { a: 1 });
assert.throws(() => { throw new Error(); });
```

## API Reference

- `assert(value, message?)` - Assert truthy
- `assert.ok(value, message?)` - Assert truthy
- `assert.equal(actual, expected, message?)` - Loose equality
- `assert.strictEqual(actual, expected, message?)` - Strict equality
- `assert.notEqual(actual, expected, message?)`
- `assert.notStrictEqual(actual, expected, message?)`
- `assert.deepEqual(actual, expected, message?)`
- `assert.notDeepEqual(actual, expected, message?)`
- `assert.throws(fn, error?, message?)`
- `assert.doesNotThrow(fn, message?)`
- `assert.fail(message?)`
- `assert.ifError(value)`

## Performance

- **50M+ downloads/week** - Node.js standard

## License

MIT
