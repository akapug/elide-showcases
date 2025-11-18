# HTTP Errors - Create HTTP Error Objects

Create HTTP errors for Express, Koa, Connect, etc. - converted for Elide.

## Overview

This library provides a simple way to create HTTP errors with status codes and messages. Perfect for REST APIs and web applications that need consistent error handling across all routes and middleware.

**Based on**: [http-errors](https://www.npmjs.com/package/http-errors) (~60M downloads/week on npm)

## Features

- ✅ **Status code errors** - Create errors with HTTP status codes
- ✅ **Named constructors** - BadRequest, NotFound, Unauthorized, etc.
- ✅ **Custom properties** - Add custom fields to errors
- ✅ **Stack traces** - Full error stack support
- ✅ **Expose flag** - Control error message exposure
- ✅ **Zero dependencies** - Pure TypeScript

## Polyglot Benefits

- **Consistent Errors** - Same error codes across Python, Ruby, Java
- **Share Logic** - Reuse error handling across languages
- **Type Safety** - Full TypeScript error types

## Usage

```typescript
import createError, { NotFound, Unauthorized } from "./elide-http-errors.ts";

// Create by status code
const error400 = createError(400, "Invalid input");
const error404 = createError(404);
const error500 = createError(500, "Database failed");

// Named constructors
const notFound = new NotFound("User not found");
const unauthorized = new Unauthorized("Invalid token");

// Custom properties
const validationError = createError(422, "Validation failed", {
  fields: { email: "Invalid format" }
});
```

## Named Error Classes

### 4xx Client Errors
- `BadRequest` (400)
- `Unauthorized` (401)
- `PaymentRequired` (402)
- `Forbidden` (403)
- `NotFound` (404)
- `MethodNotAllowed` (405)
- `Conflict` (409)
- `UnprocessableEntity` (422)
- `TooManyRequests` (429)

### 5xx Server Errors
- `InternalServerError` (500)
- `NotImplemented` (501)
- `BadGateway` (502)
- `ServiceUnavailable` (503)
- `GatewayTimeout` (504)

## Examples

### Express Middleware

```typescript
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500);
  res.json({
    error: err.message,
    code: err.name
  });
});
```

### Rate Limiting

```typescript
const rateLimitError = new TooManyRequests("Rate limit exceeded");
rateLimitError.headers = {
  "Retry-After": "60",
  "X-RateLimit-Remaining": "0"
};
```

## Use Cases

- REST API error responses
- Middleware error handling
- HTTP client errors (4xx)
- HTTP server errors (5xx)

## Running the Demo

```bash
elide run elide-http-errors.ts
```

## Learn More

- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Elide Documentation](https://docs.elide.dev/)
