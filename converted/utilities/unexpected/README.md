# unexpected - Extensible Assertion Library

**Pure TypeScript implementation of unexpected for Elide.**

Based on [unexpected](https://www.npmjs.com/package/unexpected) (~200K+ downloads/week)

## Features

- Extensible assertion framework
- Plugin system
- Custom matchers
- Rich error messages
- Zero dependencies

## Installation

```bash
elide install @elide/unexpected
```

## Usage

```typescript
import expect from './elide-unexpected.ts';

expect.expect(value, 'to be', expected);
expect.expect({ a: 1 }, 'to equal', { a: 1 });
expect.expect('hello', 'to be a', 'string');
expect.expect([1, 2, 3], 'to contain', 2);

// Add custom assertion
expect.addAssertion('to be positive', (actual: number) => {
  if (actual <= 0) throw new Error(`Expected ${actual} to be positive`);
});
```

## Built-in Assertions

- `to be` - Strict equality
- `to equal` - Deep equality
- `to be truthy` / `to be falsy`
- `to contain` - Array/string contains
- `to have length` - Length check
- `to throw` - Exception check
- `to match` - Pattern match
- `to be a` / `to be an` - Type check

## API Reference

### expect(actual, assertion, ...args)

Run an assertion.

### addAssertion(name, fn)

Add a custom assertion.

### use(plugin)

Load a plugin.

## Performance

- **200K+ downloads/week** - Extensible framework

## License

MIT
