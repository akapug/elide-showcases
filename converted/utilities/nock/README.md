# nock - HTTP Request Mocking

**Pure TypeScript implementation of nock for Elide.**

Based on [nock](https://www.npmjs.com/package/nock) (~10M+ downloads/week)

## Features

- HTTP request interception
- Response mocking
- Pattern matching
- Status codes and headers
- Zero dependencies

## Installation

```bash
elide install @elide/nock
```

## Usage

```typescript
import nock from './elide-nock.ts';

// Mock GET request
nock('https://api.example.com')
  .get('/users/1')
  .reply(200, { id: 1, name: 'Alice' });

// Mock POST request
nock('https://api.example.com')
  .post('/users')
  .reply(201, { id: 2 });

// Mock with headers
nock('https://api.example.com')
  .get('/data')
  .reply(200, { data: 'value' }, { 'Content-Type': 'application/json' });

// Pattern matching
nock('https://api.example.com')
  .get(/\/users\/\d+/)
  .reply(200, { user: 'any' });

// Persistent mock
nock('https://api.example.com')
  .get('/config')
  .reply(200, {})
  .persist();

// Clean up
nock.cleanAll();
```

## API Reference

### nock(baseURL)

Create a scope for mocking.

### Scope Methods

- `get(path)` - Mock GET
- `post(path)` - Mock POST
- `put(path)` - Mock PUT
- `delete(path)` - Mock DELETE
- `patch(path)` - Mock PATCH

### Interceptor Methods

- `reply(status, body?, headers?)` - Set response
- `replyWithError(error)` - Mock error
- `times(count)` - Repeat count
- `persist()` - Persist mock

### Global Methods

- `nock.cleanAll()` - Remove all mocks
- `nock.isDone()` - Check if mocks used
- `nock.activate()` - Activate interception
- `nock.restore()` - Restore HTTP

## Performance

- **10M+ downloads/week** - Popular HTTP mocking

## License

MIT
