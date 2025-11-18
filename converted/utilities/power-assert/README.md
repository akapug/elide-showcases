# power-assert - Enhanced Assertions

**Pure TypeScript implementation of power-assert for Elide.**

Based on [power-assert](https://www.npmjs.com/package/power-assert) (~500K+ downloads/week)

## Features

- Detailed error messages
- Expression evaluation display
- Automatic value inspection
- Zero dependencies

## Installation

```bash
elide install @elide/power-assert
```

## Usage

```typescript
import assert from './elide-power-assert.ts';

assert(value);
assert.equal(actual, expected);
assert.deepEqual(obj1, obj2);
```

## API Reference

- `assert(value, message?)` - Assert truthy
- `assert.equal(actual, expected, message?)`
- `assert.deepEqual(actual, expected, message?)`
- `assert.notEqual(actual, expected, message?)`
- `assert.throws(fn, pattern?)`

## Performance

- **500K+ downloads/week** - Enhanced assertions

## License

MIT
