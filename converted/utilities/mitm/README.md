# mitm - HTTP Interception

**Pure TypeScript implementation of mitm for Elide.**

Based on [mitm](https://www.npmjs.com/package/mitm) (~200K+ downloads/week)

## Features

- HTTP request interception
- Response mocking
- Network isolation
- Request inspection
- Zero dependencies

## Installation

```bash
elide install @elide/mitm
```

## Usage

```typescript
import mitm from './elide-mitm.ts';

// Enable interception
mitm.enable();

// Intercept requests
mitm.on('request', (req, respond) => {
  console.log(`${req.method} ${req.url}`);

  if (req.url.includes('/api/users')) {
    respond({
      statusCode: 200,
      body: [{ id: 1, name: 'Alice' }],
    });
  }
});

// Simulate request (for testing)
const response = mitm.simulateRequest('GET', 'https://api.example.com/api/users');

// Inspect requests
const requests = mitm.getRequests();

// Cleanup
mitm.clearRequests();
mitm.disable();
```

## API Reference

### mitm.enable()

Enable HTTP interception.

### mitm.disable()

Disable HTTP interception.

### mitm.on(event, handler)

Register request handler.

**Events:**
- `'request'` - Intercept HTTP requests

**Handler signature:**
```typescript
(request: InterceptedRequest, respond: (response) => void) => void
```

### mitm.simulateRequest(method, url, options?)

Simulate an HTTP request (for testing).

### mitm.getRequests()

Get all intercepted requests.

### mitm.clearRequests()

Clear request history.

### mitm.isActive()

Check if MITM is enabled.

## Types

```typescript
interface InterceptedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

interface InterceptedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}
```

## Performance

- **200K+ downloads/week** - Popular HTTP testing tool

## License

MIT
