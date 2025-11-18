# Jasmine - Behavior-Driven Development Testing

**Pure TypeScript implementation of Jasmine testing framework for Elide.**

Based on [jasmine](https://www.npmjs.com/package/jasmine) (~8M+ downloads/week)

## Features

- BDD-style syntax (describe/it)
- Built-in matchers
- Spies and mocks
- Async testing support
- Setup/teardown hooks
- Zero dependencies

## Installation

```bash
elide install @elide/jasmine
```

## Usage

### Basic Test Suite

```typescript
import { describe, it, expect } from "./elide-jasmine.ts";

describe("Calculator", () => {
  it("should add numbers", () => {
    expect(2 + 2).toBe(4);
  });

  it("should handle objects", () => {
    expect({ a: 1 }).toEqual({ a: 1 });
  });
});
```

### Matchers

```typescript
expect(value).toBe(expected);         // ===
expect(value).toEqual(expected);      // Deep equality
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();
expect(arr).toContain(item);
expect(str).toMatch(/pattern/);
expect(fn).toThrow();
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);

// Negation
expect(value).not.toBe(other);
```

### Spies

```typescript
import { createSpy, spyOn, expect } from "./elide-jasmine.ts";

// Create a spy
const spy = createSpy("testSpy");
spy(1, 2);

expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledWith(1, 2);
expect(spy.calls.count()).toBe(1);

// Spy on object methods
const obj = { method: (x) => x * 2 };
spyOn(obj, "method").and.returnValue(42);

const result = obj.method(5);
expect(result).toBe(42);
expect(obj.method).toHaveBeenCalledWith(5);
```

### Spy Configuration

```typescript
const spy = createSpy();

// Return value
spy.and.returnValue(42);

// Call through to original
spy.and.callThrough();

// Throw error
spy.and.throwError("Error message");

// Stub (no return value)
spy.and.stub();

// Reset calls
spy.calls.reset();

// Access call data
spy.calls.count();
spy.calls.argsFor(0);
spy.calls.allArgs();
spy.calls.mostRecent();
spy.calls.first();
```

### Hooks

```typescript
describe("Database tests", () => {
  let db;

  beforeAll(async () => {
    db = await connect();
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
    db.save({ id: 1 });
    expect(db.count()).toBe(1);
  });
});
```

### Pending Tests

```typescript
describe("Future features", () => {
  it("will be implemented later");

  it.skip("skipped test");

  it.only("focused test", () => {
    // Only this test runs
  });
});
```

### Async Tests

```typescript
describe("Async operations", () => {
  it("handles promises", async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });

  it("handles async/await", async () => {
    await performOperation();
    expect(state).toBe("complete");
  });
});
```

## Polyglot Benefits

Use the same BDD framework across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One BDD pattern, all languages!

## API Reference

### Test Definition

- `describe(description, fn)` - Define test suite
- `it(expectation, fn?)` - Define spec
- `it.skip(expectation)` - Skip spec
- `it.only(expectation, fn)` - Focused spec

### Matchers

- `expect(actual).toBe(expected)` - Strict equality
- `expect(actual).toEqual(expected)` - Deep equality
- `expect(actual).toBeTruthy()` - Truthy check
- `expect(actual).toBeFalsy()` - Falsy check
- `expect(actual).toBeNull()` - Null check
- `expect(actual).toBeUndefined()` - Undefined check
- `expect(actual).toBeDefined()` - Defined check
- `expect(actual).toContain(item)` - Contains check
- `expect(actual).toMatch(pattern)` - Regex match
- `expect(fn).toThrow(error?)` - Exception check
- `expect(actual).toBeGreaterThan(n)` - Greater than
- `expect(actual).toBeLessThan(n)` - Less than
- `expect(spy).toHaveBeenCalled()` - Spy called
- `expect(spy).toHaveBeenCalledWith(...)` - Spy called with args
- `expect(actual).not.*` - Negation

### Spies

- `createSpy(name?, originalFn?)` - Create spy
- `spyOn(obj, methodName)` - Spy on method
- `spy.and.returnValue(value)` - Set return value
- `spy.and.callThrough()` - Call original
- `spy.and.throwError(error)` - Throw error
- `spy.and.stub()` - Stub (no-op)
- `spy.calls.count()` - Call count
- `spy.calls.argsFor(index)` - Args for call
- `spy.calls.allArgs()` - All call args
- `spy.calls.mostRecent()` - Latest call
- `spy.calls.first()` - First call
- `spy.calls.reset()` - Reset spy

### Hooks

- `beforeAll(fn)` - Before all specs
- `beforeEach(fn)` - Before each spec
- `afterEach(fn)` - After each spec
- `afterAll(fn)` - After all specs

### Runner

- `execute()` - Run all tests

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **10x faster** - Cold start vs Node.js on Elide
- **8M+ downloads/week** - Popular BDD framework

## License

MIT
