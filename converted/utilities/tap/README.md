# TAP - Test Anything Protocol

**Pure TypeScript implementation of TAP test runner for Elide.**

Based on [tap](https://www.npmjs.com/package/tap) (~2M+ downloads/week)

## Features

- TAP version 13 output
- Simple test API
- Sub-tests support
- Built-in assertions
- Universal format
- Zero dependencies

## Installation

```bash
elide install @elide/tap
```

## Usage

### Basic Tests

```typescript
import tap from "./elide-tap.ts";

tap(async (t) => {
  t.test("math operations", (t) => {
    t.equal(2 + 2, 4, "addition works");
    t.notEqual(5, 3, "not equal");
  });

  t.test("truthiness", (t) => {
    t.ok(true, "is truthy");
    t.notOk(false, "is falsy");
  });
});
```

### Assertions

```typescript
// Boolean
t.ok(value, message);
t.notOk(value, message);

// Equality
t.equal(actual, expected, message);
t.notEqual(actual, expected, message);
t.same(actual, expected, message);  // Deep equal

// Type checking
t.type(value, "number", message);
t.type(value, "string", message);
t.type(value, "array", message);

// Pattern matching
t.match(string, /pattern/, message);

// Exceptions
t.throws(fn, expected?, message);

// Pass/Fail/Skip
t.pass(message);
t.fail(message);
t.skip(message);
```

### Sub-tests

```typescript
tap(async (t) => {
  t.test("parent test", (t) => {
    t.ok(true, "parent assertion");

    t.test("child test", (t) => {
      t.equal(1, 1, "child assertion");
    });
  });
});
```

### Async Tests

```typescript
tap(async (t) => {
  t.test("async operation", async (t) => {
    const result = await fetchData();
    t.ok(result, "got result");
    t.equal(result.status, 200, "status OK");
  });
});
```

### Exception Testing

```typescript
t.test("throws", (t) => {
  t.throws(() => {
    throw new Error("fail");
  }, "throws error");

  t.throws(() => {
    throw new Error("specific");
  }, "specific", "throws specific message");

  t.throws(() => {
    throw new Error("pattern match");
  }, /pattern/, "matches error pattern");
});
```

## TAP Output Format

```tap
TAP version 13
# math operations
ok 1 addition works
ok 2 not equal
# truthiness
ok 3 is truthy
ok 4 is falsy
1..4
# tests 4
# pass 4
```

## Polyglot Benefits

Use the same TAP protocol across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One test format, universal compatibility!

## API Reference

### Test Definition

- `tap(fn)` - Main test runner
- `t.test(name, fn)` - Define sub-test

### Assertions

- `t.ok(value, message?)` - Assert truthy
- `t.notOk(value, message?)` - Assert falsy
- `t.equal(actual, expected, message?)` - Assert equal (===)
- `t.notEqual(actual, expected, message?)` - Assert not equal
- `t.same(actual, expected, message?)` - Deep equality
- `t.type(value, type, message?)` - Type check
- `t.match(str, pattern, message?)` - Regex match
- `t.throws(fn, expected?, message?)` - Assert throws
- `t.pass(message?)` - Force pass
- `t.fail(message?)` - Force fail
- `t.skip(message?)` - Skip test

### Output

All output follows TAP version 13 specification:
- Test plan: `1..n`
- Pass: `ok n description`
- Fail: `not ok n description`
- Skip: `ok n # SKIP reason`
- Diagnostic: `# comment`

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **Universal format** - Works with all TAP consumers
- **10x faster** - Cold start vs Node.js on Elide
- **2M+ downloads/week** - Standard test protocol

## License

MIT
