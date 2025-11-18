# frisby - REST API Testing

**Pure TypeScript implementation of frisby for Elide.**

Based on [frisby](https://www.npmjs.com/package/frisby) (~300K+ downloads/week)

## Features

- BDD-style API tests
- JSON path assertions
- Type validation
- Response time checking
- Zero dependencies

## Installation

```bash
elide install @elide/frisby
```

## Usage

```typescript
import frisby from './elide-frisby.ts';

// Simple GET test
await frisby('Get user')
  .get('https://api.example.com/users/1')
  .expect.status(200)
  .expect.header('content-type', 'application/json')
  .expect.json('name', 'Alice')
  .toss();

// POST with JSON
await frisby('Create user')
  .post('https://api.example.com/users', {
    name: 'Bob',
    email: 'bob@example.com',
  })
  .expect.status(201)
  .expect.json('id', 2)
  .toss();

// JSON path assertions
await frisby('Nested data')
  .get('https://api.example.com/data')
  .expect.json('user.profile.name', 'Alice')
  .expect.json('user.settings.theme', 'dark')
  .toss();

// Type validation
await frisby('Validate types')
  .get('https://api.example.com/user')
  .expect.jsonTypes('profile', {
    name: 'string',
    age: 'number',
    active: 'boolean',
  })
  .toss();

// Headers
await frisby('With auth')
  .get('https://api.example.com/secure')
  .addHeader('Authorization', 'Bearer token123')
  .expect.status(200)
  .toss();

// Response time
await frisby('Fast endpoint')
  .get('https://api.example.com/ping')
  .expect.responseTime(100)
  .toss();
```

## API Reference

### frisby(name?)

Create a new test.

### HTTP Methods

- `get(url)` - GET request
- `post(url, data?)` - POST request
- `put(url, data?)` - PUT request
- `delete(url)` - DELETE request
- `patch(url, data?)` - PATCH request

### Request Configuration

- `addHeaders(headers)` - Add multiple headers
- `addHeader(key, value)` - Add single header
- `send(data)` - Send JSON body

### Expectations

- `expect.status(code)` - Assert status code
- `expect.header(key, value?)` - Assert header
- `expect.json(path?, value?)` - Assert JSON value
- `expect.jsonTypes(path, schema)` - Assert JSON types
- `expect.bodyContains(text)` - Assert body contains
- `expect.responseTime(maxMs)` - Assert response time

### Execution

- `toss()` - Execute test
- `then(callback)` - Chain requests

## JSON Path

Use dot notation for nested paths:
- `'name'` - Top level
- `'user.name'` - Nested
- `'users.0.name'` - Array index

## Performance

- **300K+ downloads/week** - Popular REST testing

## License

MIT
