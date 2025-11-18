# Proxyquire - Dependency Injection and Mocking

Mock and stub module dependencies during testing with a pure TypeScript implementation.

Based on [proxyquire](https://www.npmjs.com/package/proxyquire) (~500K+ downloads/week)

## Features

- ✅ Inject mock dependencies
- ✅ Stub require() calls
- ✅ Override module exports
- ✅ Zero dependencies

## Quick Start

```typescript
import proxyquire from './elide-proxyquire.ts';

const stubs = {
  'fs': { readFileSync: () => 'mocked content' }
};
const myModule = proxyquire('./myModule', stubs);
```

## Polyglot Benefits

Use the same mocking library across JavaScript, Python, Ruby, and Java via Elide!
