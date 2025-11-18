# proxyquire - Module Mocking

**Pure TypeScript implementation of proxyquire for Elide.**

Based on [proxyquire](https://www.npmjs.com/package/proxyquire) (~3M+ downloads/week)

## Features

- Dependency injection for testing
- Module stubbing
- Isolated unit tests
- Zero dependencies

## Installation

```bash
elide install @elide/proxyquire
```

## Usage

```typescript
import proxyquire from './elide-proxyquire.ts';

// Stub dependencies
const module = proxyquire('./my-module', {
  './database': {
    connect: () => mockDB,
    query: () => mockData,
  },
  './logger': {
    log: () => {},
  },
});

// Use the module with stubs
module.doSomething();
```

## API Reference

### proxyquire(modulePath, stubs)

Load a module with stubbed dependencies.

**Parameters:**
- `modulePath: string` - Module to load
- `stubs: Record<string, any>` - Dependency stubs

**Returns:** Module with stubs applied

## Performance

- **3M+ downloads/week** - Popular module mocking

## License

MIT
