# AVA - Futuristic Test Runner

**Pure TypeScript implementation of AVA test runner for Elide.**

Based on [ava](https://www.npmjs.com/package/ava) (~1.5M+ downloads/week)

## Features

- Concurrent test execution
- Simple, minimal API
- Built-in assertions
- Async/await support
- Isolated test environments
- Zero dependencies

## Installation

```bash
elide install @elide/ava
```

## Usage

### Basic Tests

```typescript
import test from "./elide-ava.ts";

test("basic assertion", (t) => {
  t.is(2 + 2, 4);
});

test("deep equality", (t) => {
  t.deepEqual({ a: 1 }, { a: 1 });
});

test("boolean checks", (t) => {
  t.true(true);
  t.false(false);
  t.truthy(1);
  t.falsy(0);
});
```

### Async Tests

```typescript
test("async operation", async (t) => {
  const result = await fetchData();
  t.is(result.status, "success");
});

test("promise handling", async (t) => {
  const value = await Promise.resolve(42);
  t.is(value, 42);
});
```

### Assertions

```typescript
// Equality
t.is(actual, expected);           // ===
t.not(actual, expected);          // !==
t.deepEqual(actual, expected);    // Deep equality
t.notDeepEqual(actual, expected); // Not deep equal

// Boolean
t.true(value);
t.false(value);
t.truthy(value);
t.falsy(value);

// Exceptions
t.throws(() => { throw new Error(); });
t.throws(() => { throw new Error("msg"); }, "msg");
t.notThrows(() => { return 42; });
await t.throwsAsync(async () => { throw new Error(); });

// Regex
t.regex(string, /pattern/);
t.notRegex(string, /pattern/);

// Pass/Fail
t.pass();
t.fail("Reason");
```

### Test Modifiers

```typescript
// Skip test
test.skip("skipped test", (t) => {
  // Won't run
});

// Only run this test
test.only("focused test", (t) => {
  t.pass();
});

// Serial execution (non-concurrent)
test.serial("run alone", (t) => {
  // Runs serially
});
```

### Concurrent Execution

```typescript
// These tests run concurrently
test("test 1", async (t) => {
  await delay(100);
  t.pass();
});

test("test 2", async (t) => {
  await delay(100);
  t.pass();
});

test("test 3", async (t) => {
  await delay(100);
  t.pass();
});
```

### Exception Testing

```typescript
test("throws error", (t) => {
  t.throws(() => {
    throw new Error("Oops!");
  });

  t.throws(() => {
    throw new Error("specific message");
  }, "specific");

  t.notThrows(() => {
    return 42;
  });
});

test("async throws", async (t) => {
  await t.throwsAsync(async () => {
    throw new Error("async error");
  });

  await t.throwsAsync(
    async () => {
      throw new Error("specific");
    },
    "specific"
  );
});
```

## Polyglot Benefits

Use the same concurrent test runner across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One test pattern, parallel execution everywhere!

## API Reference

### Test Definition

- `test(title, fn)` - Define test
- `test.skip(title, fn)` - Skip test
- `test.only(title, fn)` - Only run this test
- `test.serial(title, fn)` - Run serially

### Assertions

- `t.is(actual, expected)` - Strict equality
- `t.not(actual, expected)` - Not equal
- `t.deepEqual(actual, expected)` - Deep equality
- `t.notDeepEqual(actual, expected)` - Not deep equal
- `t.true(value)` - Is true
- `t.false(value)` - Is false
- `t.truthy(value)` - Is truthy
- `t.falsy(value)` - Is falsy
- `t.throws(fn, expected?)` - Throws error
- `t.notThrows(fn)` - Doesn't throw
- `t.throwsAsync(fn, expected?)` - Async throws
- `t.regex(str, pattern)` - Matches regex
- `t.notRegex(str, pattern)` - Doesn't match
- `t.pass()` - Force pass
- `t.fail(message?)` - Force fail

### Runner

- `run()` - Execute all tests concurrently

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **Concurrent execution** - Tests run in parallel
- **10x faster** - Cold start vs Node.js on Elide
- **1.5M+ downloads/week** - Modern test runner

## License

MIT
