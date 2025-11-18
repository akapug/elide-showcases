# Chai - BDD/TDD Assertion Library

**Pure TypeScript implementation of Chai assertion library for Elide.**

Based on [chai](https://www.npmjs.com/package/chai) (~20M+ downloads/week)

## Features

- Three assertion styles (expect, should, assert)
- Chainable language chains
- Deep equality checking
- Type checking
- Negation with `.not`
- Zero dependencies

## Installation

```bash
elide install @elide/chai
```

## Usage

### Expect Style

```typescript
import { expect } from "./elide-chai.ts";

expect(2 + 2).to.equal(4);
expect("hello").to.be.a("string");
expect([1, 2, 3]).to.have.lengthOf(3);
expect({ a: 1 }).to.have.property("a");
```

### Chainable Language

```typescript
expect(value).to.be.a("number");
expect(arr).to.not.be.empty;
expect(obj).to.have.property("x").that.equals(5);
```

### Assert Style

```typescript
import { assert } from "./elide-chai.ts";

assert.isOk(true);
assert.equal(actual, expected);
assert.deepEqual({ a: 1 }, { a: 1 });
assert.include([1, 2, 3], 2);
assert.property(obj, "key");
assert.lengthOf(arr, 3);
assert.throws(() => { throw new Error(); });
```

### Type Checking

```typescript
expect(42).to.be.a("number");
expect([]).to.be.an("array");
expect({}).to.be.an("object");
expect("test").to.be.a("string");
expect(true).to.be.true;
expect(false).to.be.false;
expect(null).to.be.null;
expect(undefined).to.be.undefined;
```

### Negation

```typescript
expect(5).to.not.equal(3);
expect([]).to.not.include(1);
expect("hello").to.not.be.empty;
expect(value).to.not.be.null;
```

### Deep Equality

```typescript
expect({ a: 1, b: { c: 2 } })
  .to.deep.equal({ a: 1, b: { c: 2 } });

expect([1, [2, 3]])
  .to.deep.equal([1, [2, 3]]);
```

### Collections

```typescript
// Arrays
expect([1, 2, 3]).to.include(2);
expect([1, 2, 3]).to.have.lengthOf(3);

// Strings
expect("hello world").to.contain("world");
expect("hello").to.have.lengthOf(5);

// Objects
expect({ a: 1, b: 2 }).to.have.property("a");
expect({ a: 1 }).to.have.property("a", 1);
```

### Comparisons

```typescript
expect(10).to.be.above(5);
expect(10).to.be.greaterThan(5);
expect(10).to.be.gt(5);

expect(3).to.be.below(5);
expect(3).to.be.lessThan(5);
expect(3).to.be.lt(5);
```

### Exception Testing

```typescript
expect(() => {
  throw new Error("fail");
}).to.throw();

expect(() => {
  throw new Error("specific error");
}).to.throw("specific error");

expect(() => {
  throw new Error("error message");
}).to.throw(/error/);

assert.throws(() => {
  throw new Error();
}, "expected message");
```

## Polyglot Benefits

Use the same assertion library across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One assertion syntax, all languages!

## API Reference

### Expect API

- `expect(value)` - Create assertion
- `.to`, `.be`, `.is`, `.that`, `.which`, `.and`, `.has`, `.have`, `.with`, `.at`, `.of`, `.same` - Language chains
- `.not` - Negate assertion
- `.deep` - Deep equality mode
- `.equal(value)`, `.eq(value)` - Equality
- `.eql(value)` - Deep equality
- `.ok` - Truthy
- `.true`, `.false` - Boolean
- `.null`, `.undefined` - Null/undefined
- `.exist` - Not null/undefined
- `.empty` - Empty array/string/object
- `.a(type)`, `.an(type)` - Type checking
- `.include(value)`, `.contain(value)` - Contains
- `.property(name, value?)` - Object property
- `.length(n)`, `.lengthOf(n)` - Length
- `.match(regex)` - Regex match
- `.throw(error?)` - Exception
- `.above(n)`, `.gt(n)`, `.greaterThan(n)` - Greater than
- `.below(n)`, `.lt(n)`, `.lessThan(n)` - Less than

### Assert API

- `assert.isOk(value)` - Truthy
- `assert.isTrue(value)`, `assert.isFalse(value)` - Boolean
- `assert.isNull(value)`, `assert.isUndefined(value)` - Null/undefined
- `assert.equal(actual, expected)` - Equality
- `assert.deepEqual(actual, expected)` - Deep equality
- `assert.include(haystack, needle)` - Contains
- `assert.property(object, property)` - Property exists
- `assert.lengthOf(value, length)` - Length
- `assert.throws(fn, error?)` - Exception

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **10x faster** - Cold start vs Node.js on Elide
- **20M+ downloads/week** - Most popular assertion library

## License

MIT
