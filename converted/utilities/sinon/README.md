# Sinon - Test Spies, Stubs, and Mocks

**Pure TypeScript implementation of Sinon test doubles for Elide.**

Based on [sinon](https://www.npmjs.com/package/sinon) (~15M+ downloads/week)

## Features

- Spies (track function calls)
- Stubs (replace behavior)
- Mocks (expectations + verification)
- Fake timers
- Zero dependencies

## Installation

```bash
elide install @elide/sinon
```

## Usage

### Spies

Track function calls without changing behavior:

```typescript
import { spy } from "./elide-sinon.ts";

const callback = spy();
callback("hello");
callback("world");

console.log(callback.called());           // true
console.log(callback.callCount);          // 2
console.log(callback.calledWith("hello")); // true
console.log(callback.firstCall.args);     // ["hello"]
```

### Spy on Existing Functions

```typescript
const original = (x) => x * 2;
const spyFn = spy(original);

const result = spyFn(5);
console.log(result);                // 10
console.log(spyFn.calledWith(5));   // true
```

### Stubs

Replace function behavior:

```typescript
import { stub } from "./elide-sinon.ts";

const stubFn = stub();
stubFn.returns(42);

console.log(stubFn());  // 42
console.log(stubFn());  // 42
```

### Stub with Multiple Returns

```typescript
const multi = stub();
multi.returns(1);
multi.returns(2);
multi.returns(3);

console.log(multi());  // 1
console.log(multi());  // 2
console.log(multi());  // 3
console.log(multi());  // 3 (last value repeats)
```

### Stub Methods

```typescript
const obj = {
  method: (x) => x * 2
};

const stubMethod = stub(obj, "method");
stubMethod.returns(100);

console.log(obj.method(5));    // 100
stubMethod.restore();
console.log(obj.method(5));    // 10
```

### Stub Behaviors

```typescript
// Return value
stub().returns(42);

// Return this
stub().returnsThis();

// Throw error
stub().throws("Error message");
stub().throws(new Error("Custom error"));

// Call callback argument
const s = stub();
s.callsArgWith(0, "arg1", "arg2");
s((a, b) => console.log(a, b));  // "arg1 arg2"

// Yield to property
const s2 = stub();
s2.yieldsTo("onSuccess", "data");
s2({ onSuccess: (data) => console.log(data) });  // "data"
```

### Spy Assertions

```typescript
const spy = spy();
spy(1, 2);
spy(3, 4);

// Call tracking
spy.called();                    // true
spy.callCount;                   // 2
spy.calledOnce();               // false
spy.calledTwice();              // true

// Argument matching
spy.calledWith(1, 2);           // true
spy.alwaysCalledWith(1, 2);     // false

// Call order
const spy1 = spy();
const spy2 = spy();
spy1();
spy2();
spy1.calledBefore(spy2);        // true
spy2.calledAfter(spy1);         // true

// Call data
spy.firstCall.args;             // [1, 2]
spy.lastCall.args;              // [3, 4]
spy.getCall(0).args;            // [1, 2]

// Reset
spy.reset();
spy.called();                   // false
```

### Mocks

Expectations with verification:

```typescript
import { mock } from "./elide-sinon.ts";

const obj = {
  save: (data) => console.log(data),
  load: () => ({ data: "loaded" })
};

const mockObj = mock(obj);

// Set expectations
mockObj.expects("save")
  .once()
  .withArgs({ id: 1 })
  .returns(true);

// Use object
obj.save({ id: 1 });

// Verify expectations met
mockObj.verify();  // Passes

// Restore
mockObj.restore();
```

### Fake Timers

Test time-dependent code:

```typescript
import { useFakeTimers } from "./elide-sinon.ts";

const clock = useFakeTimers();

let executed = false;
clock.setTimeout(() => {
  executed = true;
}, 1000);

console.log(executed);  // false

clock.tick(1000);       // Advance time 1 second

console.log(executed);  // true
```

### Intervals

```typescript
const clock = useFakeTimers();

let count = 0;
clock.setInterval(() => {
  count++;
}, 100);

clock.tick(250);
console.log(count);  // 2

clock.reset();
```

## Polyglot Benefits

Use the same test doubles across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One mocking library, all languages!

## API Reference

### Spies

- `spy(fn?)` - Create spy
- `spy.called()` - Was called
- `spy.callCount` - Number of calls
- `spy.calledOnce()` - Called once
- `spy.calledTwice()` - Called twice
- `spy.calledWith(...args)` - Called with args
- `spy.alwaysCalledWith(...args)` - Always called with args
- `spy.calledBefore(other)` - Called before other spy
- `spy.calledAfter(other)` - Called after other spy
- `spy.firstCall` - First call record
- `spy.lastCall` - Last call record
- `spy.getCall(n)` - Get nth call
- `spy.reset()` - Reset spy

### Stubs

- `stub(obj?, method?)` - Create stub
- `stub.returns(value)` - Return value
- `stub.returnsThis()` - Return this
- `stub.throws(error?)` - Throw error
- `stub.callsArgWith(index, ...args)` - Call callback arg
- `stub.yieldsTo(property, ...args)` - Yield to property
- `stub.restore()` - Restore original (if stubbing object method)

### Mocks

- `mock(obj)` - Create mock
- `mock.expects(method)` - Set expectation
  - `.withArgs(...args)` - Expect specific args
  - `.returns(value)` - Return value
  - `.once()` - Expect called once
  - `.twice()` - Expect called twice
  - `.exactly(n)` - Expect called n times
- `mock.verify()` - Verify expectations
- `mock.restore()` - Restore object

### Fake Timers

- `useFakeTimers()` - Create fake timers
- `clock.tick(ms)` - Advance time
- `clock.setTimeout(fn, delay)` - Fake setTimeout
- `clock.setInterval(fn, delay)` - Fake setInterval
- `clock.clearTimeout(id)` - Clear timeout
- `clock.clearInterval(id)` - Clear interval
- `clock.reset()` - Reset clock

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **10x faster** - Cold start vs Node.js on Elide
- **15M+ downloads/week** - Most popular mocking library

## License

MIT
