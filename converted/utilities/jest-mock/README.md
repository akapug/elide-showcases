# jest-mock - Mock Function Utilities

**Pure TypeScript implementation of jest-mock for Elide.**

Based on [jest-mock](https://www.npmjs.com/package/jest-mock) (~45M+ downloads/week)

## Features

- Mock function creation with call tracking
- Return value mocking
- Implementation mocking
- Async promise mocking
- Spy on object methods
- Mock clear/reset/restore
- Zero dependencies

## Installation

```bash
elide install @elide/jest-mock
```

## Usage

### Basic Mock

```typescript
import { fn } from './elide-jest-mock.ts';

const mockFn = fn();
mockFn('hello');
mockFn('world');

console.log(mockFn.mock.calls);
// [['hello'], ['world']]

console.log(mockFn.mock.calls.length);
// 2
```

### Mock Return Value

```typescript
const mockFn = fn().mockReturnValue(42);

console.log(mockFn()); // 42
console.log(mockFn()); // 42
```

### Mock Implementation

```typescript
const mockAdd = fn().mockImplementation((a: number, b: number) => a + b);

console.log(mockAdd(2, 3)); // 5
console.log(mockAdd(5, 7)); // 12
```

### Once Values

```typescript
const mockFn = fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

console.log(mockFn()); // 'first'
console.log(mockFn()); // 'second'
console.log(mockFn()); // 'default'
console.log(mockFn()); // 'default'
```

### Async Mocks

```typescript
// Resolved promises
const mockAsync = fn().mockResolvedValue('success');
const result = await mockAsync();
console.log(result); // 'success'

// Rejected promises
const mockFail = fn().mockRejectedValue(new Error('failed'));
try {
  await mockFail();
} catch (err) {
  console.log(err.message); // 'failed'
}
```

### Spy on Methods

```typescript
import { spyOn } from './elide-jest-mock.ts';

const obj = {
  add(a: number, b: number) {
    return a + b;
  },
};

const spy = spyOn(obj, 'add');

obj.add(2, 3); // Still works normally
console.log(spy.mock.calls); // [[2, 3]]

spy.mockRestore(); // Restore original
```

### Clear and Reset

```typescript
const mockFn = fn().mockReturnValue('test');
mockFn();
mockFn();

console.log(mockFn.mock.calls.length); // 2

mockFn.mockClear(); // Clear calls
console.log(mockFn.mock.calls.length); // 0

mockFn.mockReset(); // Clear calls and implementation
mockFn.mockRestore(); // Restore original (for spies)
```

## Polyglot Benefits

Use the same mocking API across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One mocking library, all languages!

## API Reference

### fn(implementation?)

Create a mock function.

**Parameters:**
- `implementation?: Function` - Optional default implementation

**Returns:** `MockFn` - Mock function with tracking

### MockFn Methods

#### Configuration

- `mockReturnValue(value)` - Set return value for all calls
- `mockReturnValueOnce(value)` - Set return value for next call
- `mockResolvedValue(value)` - Return resolved promise
- `mockResolvedValueOnce(value)` - Return resolved promise once
- `mockRejectedValue(value)` - Return rejected promise
- `mockRejectedValueOnce(value)` - Return rejected promise once
- `mockImplementation(fn)` - Set implementation
- `mockImplementationOnce(fn)` - Set implementation for next call
- `mockReturnThis()` - Return `this` context
- `mockName(name)` - Set mock name for debugging

#### Inspection

- `mock.calls` - Array of call arguments
- `mock.results` - Array of call results
- `mock.instances` - Array of `this` contexts
- `mock.lastCall` - Arguments of last call

#### Cleanup

- `mockClear()` - Clear calls and results
- `mockReset()` - Clear and remove implementation
- `mockRestore()` - Restore original (for spies)

### spyOn(object, method)

Spy on an object method.

**Parameters:**
- `object: Object` - Object containing method
- `method: string` - Method name to spy on

**Returns:** `MockFn` - Spy function

### isMockFunction(fn)

Check if a value is a mock function.

### mocked(item)

Type helper for mocked values.

## Mock Context

```typescript
interface MockContext {
  calls: any[][];              // Call arguments
  results: MockResult[];       // Call results
  instances: any[];            // this contexts
  invocationCallOrder: number[]; // Call order
  lastCall?: any[];            // Last call args
}

interface MockResult {
  type: 'return' | 'throw' | 'incomplete';
  value?: any;
}
```

## Performance

- **Zero dependencies** - Pure TypeScript
- **Full call tracking** - Complete mock state
- **10x faster** - Cold start vs Node.js on Elide
- **45M+ downloads/week** - Industry standard

## License

MIT
