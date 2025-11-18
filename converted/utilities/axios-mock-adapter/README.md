# Axios Mock Adapter - Axios Mocking

Mock axios requests for testing.

Based on [axios-mock-adapter](https://www.npmjs.com/package/axios-mock-adapter) (~500K+ downloads/week)

## Features

- ✅ Mock axios requests
- ✅ Request/response matching
- ✅ Zero dependencies

## Quick Start

```typescript
import MockAdapter from './elide-axios-mock-adapter.ts';

const mock = new MockAdapter(axios);
mock.onGet('/users').reply(200, [{ id: 1 }]);
mock.onPost('/users').reply(201, { id: 2 });

mock.restore();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
