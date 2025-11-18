# HTTP Fake Backend - HTTP Backend Mocking

Fake HTTP backend for testing.

Based on [http-fake-backend](https://www.npmjs.com/package/http-fake-backend) (~20K+ downloads/week)

## Features

- ✅ Fake HTTP backend
- ✅ Request interception
- ✅ Zero dependencies

## Quick Start

```typescript
import HttpFakeBackend from './elide-http-fake-backend.ts';

const backend = new HttpFakeBackend();
backend.when('GET', '/api/users').respond(200, [{ id: 1 }]);
backend.flush();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
