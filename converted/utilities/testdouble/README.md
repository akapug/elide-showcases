# testdouble - Test Doubles

**Pure TypeScript implementation of testdouble for Elide.**

Based on [testdouble](https://www.npmjs.com/package/testdouble) (~500K+ downloads/week)

## Features

- Function stubs and spies
- Return value configuration
- Call verification
- Object stubbing
- Zero dependencies

## Installation

```bash
elide install @elide/testdouble
```

## Usage

```typescript
import td from './elide-testdouble.ts';

// Create test double
const double = td.func<(a: number, b: number) => number>();

// Configure return value
td.when(double).thenReturn(42);
console.log(double(1, 2)); // 42

// Stub implementation
td.when(double).thenDo((a, b) => a + b);

// Verify calls
double(2, 3);
td.verify(double, 2, 3);

// Object stubs
const obj = td.object<{ method: () => string }>();
td.when(obj.method).thenReturn('result');

// Replace methods
td.replace(myObject, 'method', td.func());

// Reset
td.reset();
```

## API Reference

### td.func(name?)

Create a test double function.

### td.object(blueprint?)

Create an object with stubbed methods.

### td.when(double, ...args)

Configure test double behavior:
- `.thenReturn(value)` - Return value
- `.thenThrow(error)` - Throw error
- `.thenDo(fn)` - Custom implementation

### td.verify(double, ...args)

Verify function was called with args.

### td.replace(obj, method, replacement?)

Replace object method with double.

### td.reset()

Reset all test doubles.

## Performance

- **500K+ downloads/week** - Popular test double library

## License

MIT
