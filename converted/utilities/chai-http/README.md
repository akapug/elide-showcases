# chai-http - HTTP Integration Testing

**Pure TypeScript implementation of chai-http for Elide.**

Based on [chai-http](https://www.npmjs.com/package/chai-http) (~2M+ downloads/week)

## Features

- HTTP request testing
- Expressive assertions
- JSON validation
- Headers and cookies
- Zero dependencies

## Installation

```bash
elide install @elide/chai-http
```

## Usage

```typescript
import chai from './elide-chai-http.ts';

// GET request
const res = await chai
  .request('https://api.example.com')
  .get('/users/1')
  .end();

res.have.status(200);
res.have.header('content-type', 'application/json');

// POST request
await chai
  .request('https://api.example.com')
  .post('/users')
  .send({ name: 'Alice', email: 'alice@example.com' })
  .end();

// Custom headers
await chai
  .request('https://api.example.com')
  .get('/secure')
  .set('Authorization', 'Bearer token123')
  .set({ 'X-Custom-Header': 'value' })
  .end();

// Query parameters
await chai
  .request('https://api.example.com')
  .get('/search')
  .query({ q: 'test', limit: '10' })
  .end();

// Assertions
const response = await chai.request(app).get('/data').end();
response.have.status(200);
response.have.header('content-type');
response.have.property('id', 1);
response.body.eql({ id: 1, name: 'Test' });
```

## API Reference

### chai.request(app)

Create a request object.

**Parameters:**
- `app: string | App` - Base URL or Express app

**Returns:** `ChaiHTTPRequest`

### Request Methods

- `get(path)` - GET request
- `post(path)` - POST request
- `put(path)` - PUT request
- `delete(path)` - DELETE request
- `patch(path)` - PATCH request

### Request Configuration

- `set(headers)` / `set(key, value)` - Set headers
- `send(body)` - Set request body
- `query(params)` - Set query parameters
- `end()` - Execute request

### Response Assertions

- `have.status(code)` - Assert status code
- `have.header(key, value?)` - Assert header
- `have.property(key, value?)` - Assert body property
- `body.eql(expected)` - Deep equal body
- `text.equal(expected)` - Assert response text

## Performance

- **2M+ downloads/week** - Popular HTTP testing

## License

MIT
