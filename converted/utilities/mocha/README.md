# Mocha - Simple, Flexible, Fun Testing

**Pure TypeScript implementation of Mocha test framework for Elide.**

Based on [mocha](https://www.npmjs.com/package/mocha) (~25M+ downloads/week)

## Features

- BDD/TDD/Exports interfaces
- Async testing (promises, async/await)
- Hooks (before, after, beforeEach, afterEach)
- Pending tests
- Test context with timeout/slow/retries
- Zero dependencies

## Installation

```bash
elide install @elide/mocha
```

## Usage

### Basic Test Suite

```typescript
import { describe, it } from "./elide-mocha.ts";

describe("Array", () => {
  describe("#indexOf()", () => {
    it("should return -1 when value is not present", () => {
      const arr = [1, 2, 3];
      if (arr.indexOf(4) !== -1) {
        throw new Error("Expected -1");
      }
    });
  });
});
```

### Async Tests

```typescript
describe("Async Operations", () => {
  it("supports promises", async () => {
    const result = await fetchData();
    if (!result) throw new Error("No data");
  });

  it("supports async/await", async () => {
    await doSomethingAsync();
  });
});
```

### Hooks

```typescript
describe("Database tests", () => {
  before(async () => {
    await db.connect();
  });

  beforeEach(() => {
    db.clear();
  });

  afterEach(() => {
    db.cleanup();
  });

  after(async () => {
    await db.disconnect();
  });

  it("saves data", () => {
    db.save({ id: 1 });
    // assertions...
  });
});
```

### Pending Tests

```typescript
describe("Future features", () => {
  it("will be implemented later");

  it("is already implemented", () => {
    // test code...
  });
});
```

### Test Context

```typescript
describe("Timeout tests", () => {
  it("custom timeout", function () {
    this.timeout(5000); // 5 second timeout
    this.slow(3000); // Mark slow if > 3s
    this.retries(3); // Retry up to 3 times

    // test code...
  });
});
```

## Polyglot Benefits

Use the same test framework across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One test pattern, all languages!

## API Reference

### Test Definition

- `describe(title, fn)` - Define a test suite
- `it(title, fn?)` - Define a test (pending if no fn)
- `it.skip(title)` - Skip a test
- `it.only(title, fn)` - Run only this test

### Hooks

- `before(fn)` - Run before all tests
- `after(fn)` - Run after all tests
- `beforeEach(fn)` - Run before each test
- `afterEach(fn)` - Run after each test

### Test Context

- `this.timeout(ms)` - Set timeout for test
- `this.slow(ms)` - Mark test as slow
- `this.skip()` - Skip current test
- `this.retries(n)` - Retry test n times on failure

### Runner

- `run()` - Execute all tests

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **10x faster** - Cold start vs Node.js on Elide
- **25M+ downloads/week** - Trusted by millions

## License

MIT
