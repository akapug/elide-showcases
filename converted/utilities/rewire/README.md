# rewire - Access Module Internals

**Pure TypeScript implementation of rewire for Elide.**

Based on [rewire](https://www.npmjs.com/package/rewire) (~2M+ downloads/week)

## Features

- Access private variables
- Mock private functions
- Modify module internals
- Temporary overrides
- Zero dependencies

## Installation

```bash
elide install @elide/rewire
```

## Usage

```typescript
import rewire from './elide-rewire.ts';

const myModule = rewire('./my-module');

// Get private variable
const privateVar = myModule.__get__('_privateVar');

// Set private variable
myModule.__set__('_privateVar', 100);

// Set multiple values
myModule.__set__({
  _var1: 'value1',
  _var2: 'value2',
});

// Temporary override
const restore = myModule.__with__({ _privateVar: 999 });
// ... test code ...
restore(); // Reset to original
```

## API Reference

### rewire(modulePath)

Create a rewired module instance.

### RewiredModule Methods

- `__get__(name)` - Get private variable
- `__set__(name, value)` - Set private variable
- `__set__(obj)` - Set multiple variables
- `__reset__(name)` - Reset to original
- `__with__(obj)` - Temporary override (returns restore fn)
- `__module__()` - Get original module

## Performance

- **2M+ downloads/week** - Popular introspection tool

## License

MIT
