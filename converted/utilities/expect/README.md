# expect - Assertion Library

**Pure TypeScript implementation of expect for Elide.**

Based on [expect](https://www.npmjs.com/package/expect) (~10M+ downloads/week)

## Features

- Chainable matchers
- Type checking
- Array/object matching
- Exception testing
- Negation with `.not`
- Zero dependencies

## Installation

```bash
elide install @elide/expect
```

## Usage

```typescript
import { expect } from './elide-expect.ts';

// Basic assertions
expect(2 + 2).toBe(4);
expect({ a: 1 }).toEqual({ a: 1 });

// Truthiness
expect(true).toBeTruthy();
expect(false).toBeFalsy();

// Arrays
expect([1, 2, 3]).toContain(2);
expect([1, 2, 3]).toHaveLength(3);

// Negation
expect(5).not.toBe(3);

// Exceptions
expect(() => { throw new Error(); }).toThrow();
```

## API Reference

- `toBe(value)` - Strict equality (===)
- `toEqual(value)` - Deep equality
- `toBeTruthy()` / `toBeFalsy()`
- `toBeNull()` / `toBeUndefined()` / `toBeDefined()`
- `toBeGreaterThan(n)` / `toBeLessThan(n)`
- `toContain(item)` - Array/string contains
- `toHaveLength(n)` - Array/string length
- `toThrow(error?)` - Exception check
- `toMatch(pattern)` - String/RegExp match
- `toMatchObject(obj)` - Partial object match
- `toHaveProperty(path, value?)` - Property check
- `.not` - Negate any matcher

## Performance

- **Zero dependencies** - Pure TypeScript
- **10M+ downloads/week** - Popular library

## License

MIT
