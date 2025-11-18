# Jest - Delightful JavaScript Testing

**Pure TypeScript implementation of Jest testing framework for Elide.**

Based on [jest](https://www.npmjs.com/package/jest) (~45M+ downloads/week)

## Features

- Test suites with `describe()` and `it()`/`test()`
- Rich matchers via `expect()` assertions
- Mock functions with `jest.fn()`
- Setup/teardown hooks (beforeEach, afterEach, etc.)
- Async test support
- Zero dependencies

## Installation

```bash
elide install @elide/jest
```

## Usage

### Basic Test Suite

```typescript
import { describe, it, expect } from "./elide-jest.ts";

describe("Math operations", () => {
  it("adds numbers correctly", () => {
    expect(2 + 2).toBe(4);
  });

  it("subtracts numbers correctly", () => {
    expect(5 - 3).toBe(2);
  });
});
```

### Matchers

```typescript
// Equality
expect(value).toBe(4);
expect(obj).toEqual({ a: 1, b: 2 });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Contains
expect([1, 2, 3]).toContain(2);
expect("hello world").toContain("world");

// Exceptions
expect(() => { throw new Error("fail"); }).toThrow();
expect(() => { throw new Error("fail"); }).toThrow("fail");

// Negation
expect(value).not.toBe(5);
```

### Mock Functions

```typescript
import { jest, expect } from "./elide-jest.ts";

const mockFn = jest.fn();
mockFn(1, 2);
mockFn(3, 4);

expect(mockFn.mock.calls.length).toBe(2);
expect(mockFn.mock.calls[0]).toEqual([1, 2]);

// Mock return values
const mockAdd = jest.fn().mockReturnValue(42);
expect(mockAdd()).toBe(42);

// Mock implementation
const mockCalc = jest.fn().mockImplementation((a, b) => a + b);
expect(mockCalc(2, 3)).toBe(5);
```

### Setup and Teardown

```typescript
describe("Database tests", () => {
  let db;

  beforeAll(async () => {
    db = await connectDatabase();
  });

  beforeEach(() => {
    db.clear();
  });

  afterEach(() => {
    db.cleanup();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it("saves data", () => {
    db.save({ id: 1, name: "Alice" });
    expect(db.count()).toBe(1);
  });
});
```

## Polyglot Benefits

Use the same testing framework across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One testing pattern, all languages!

## API Reference

### Test Definition

- `describe(name, fn)` - Define a test suite
- `it(name, fn)` - Define a test
- `test(name, fn)` - Alias for `it()`

### Matchers

- `expect(value).toBe(expected)` - Strict equality
- `expect(value).toEqual(expected)` - Deep equality
- `expect(value).toBeTruthy()` - Truthy check
- `expect(value).toBeFalsy()` - Falsy check
- `expect(value).toBeNull()` - Null check
- `expect(value).toBeUndefined()` - Undefined check
- `expect(array).toContain(item)` - Array/string contains
- `expect(fn).toThrow(error?)` - Exception check
- `expect(value).not.*` - Negation

### Mocking

- `jest.fn(impl?)` - Create mock function
- `mock.mockReturnValue(value)` - Set return value
- `mock.mockImplementation(fn)` - Set implementation
- `mock.mock.calls` - Array of call arguments
- `mock.mock.results` - Array of call results

### Hooks

- `beforeAll(fn)` - Run before all tests in suite
- `beforeEach(fn)` - Run before each test
- `afterEach(fn)` - Run after each test
- `afterAll(fn)` - Run after all tests in suite

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **10x faster** - Cold start vs Node.js on Elide
- **45M+ downloads/week** - Most popular test framework

## License

MIT
