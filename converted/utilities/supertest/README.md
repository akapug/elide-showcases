# SuperTest - HTTP Assertions Made Easy

**Pure TypeScript implementation of SuperTest for Elide.**

Based on [supertest](https://www.npmjs.com/package/supertest) (~15M+ downloads/week)

## Features

- HTTP request testing
- Fluent API
- Status code assertions
- Header assertions
- Body assertions
- Promise-based
- Zero dependencies

## Installation

```bash
elide install @elide/supertest
```

## Usage

### Basic Requests

```typescript
import supertest from "./elide-supertest.ts";

const app = myExpressApp;
const request = supertest(app);

// GET request
await request
  .get("/api/users")
  .expect(200);

// POST request
await request
  .post("/api/users")
  .send({ name: "John Doe" })
  .expect(201);

// PUT request
await request
  .put("/api/users/1")
  .send({ name: "Jane Doe" })
  .expect(200);

// DELETE request
await request
  .delete("/api/users/1")
  .expect(204);
```

### Status Code Assertions

```typescript
await request
  .get("/api/users")
  .expect(200);

await request
  .post("/api/users")
  .send({ name: "John" })
  .expect(201);

await request
  .get("/api/not-found")
  .expect(404);
```

### Header Assertions

```typescript
// Exact match
await request
  .get("/api/users")
  .expect("Content-Type", "application/json");

// Regex match
await request
  .get("/api/users")
  .expect("Content-Type", /json/);

// Multiple headers
await request
  .get("/api/users")
  .expect("Content-Type", /json/)
  .expect("X-API-Version", "1.0");
```

### Body Assertions

```typescript
await request
  .get("/api/users/1")
  .expect(200)
  .expect({ id: 1, name: "John Doe" });
```

### Request Headers

```typescript
await request
  .get("/api/users")
  .set("Authorization", "Bearer token123")
  .set("Accept", "application/json")
  .expect(200);

// Set multiple headers
await request
  .get("/api/users")
  .set({
    "Authorization": "Bearer token123",
    "Accept": "application/json",
  })
  .expect(200);
```

### Request Body

```typescript
// JSON body
await request
  .post("/api/users")
  .send({ name: "John", email: "john@example.com" })
  .expect(201);

// Form data
await request
  .post("/api/form")
  .type("form")
  .send("name=John&email=john@example.com")
  .expect(200);
```

### Query Parameters

```typescript
await request
  .get("/api/search")
  .query({ q: "test", limit: 10 })
  .expect(200);

// Equivalent to: GET /api/search?q=test&limit=10
```

### Content Types

```typescript
// JSON
await request
  .post("/api/users")
  .type("json")
  .send({ name: "John" });

// Form
await request
  .post("/api/form")
  .type("form")
  .send("name=John");

// HTML
await request
  .post("/api/html")
  .type("html")
  .send("<h1>Hello</h1>");

// Custom
await request
  .post("/api/data")
  .type("application/xml")
  .send("<data></data>");
```

### Accept Header

```typescript
await request
  .get("/api/users")
  .accept("json")
  .expect(200);

await request
  .get("/api/users")
  .accept("application/json")
  .expect(200);
```

### Response Handling

```typescript
// With callback
await request
  .get("/api/users")
  .expect(200)
  .end((err, res) => {
    if (err) throw err;
    console.log(res.body);
  });

// With promise
const res = await request
  .get("/api/users")
  .expect(200);

console.log(res.body);
console.log(res.status);
console.log(res.headers);
```

### Chaining Assertions

```typescript
await request
  .post("/api/users")
  .send({ name: "John", email: "john@example.com" })
  .set("Authorization", "Bearer token123")
  .expect(201)
  .expect("Content-Type", /json/)
  .expect({ id: 1, name: "John", email: "john@example.com" });
```

### Testing with Jest

```typescript
import { describe, it, expect } from "./elide-jest.ts";
import supertest from "./elide-supertest.ts";

describe("User API", () => {
  const request = supertest(app);

  it("should get all users", async () => {
    const res = await request
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should create a user", async () => {
    await request
      .post("/api/users")
      .send({ name: "John Doe", email: "john@example.com" })
      .expect(201)
      .expect({ id: 1, name: "John Doe", email: "john@example.com" });
  });
});
```

## Polyglot Benefits

Use the same HTTP testing library across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One HTTP testing framework everywhere!

## API Reference

### HTTP Methods

- `request.get(url)` - GET request
- `request.post(url)` - POST request
- `request.put(url)` - PUT request
- `request.patch(url)` - PATCH request
- `request.delete(url)` - DELETE request

### Request Configuration

- `.set(field, value)` - Set header
- `.set(headers)` - Set multiple headers
- `.query(params)` - Set query parameters
- `.send(data)` - Set request body
- `.type(type)` - Set Content-Type
- `.accept(type)` - Set Accept header

### Assertions

- `.expect(status)` - Expect status code
- `.expect(field, value)` - Expect header
- `.expect(body)` - Expect response body

### Response

- `.end(callback)` - Execute with callback
- `.then(onFulfilled, onRejected)` - Promise interface

### Response Object

- `res.status` - Status code
- `res.statusText` - Status text
- `res.headers` - Response headers
- `res.body` - Parsed body (JSON)
- `res.text` - Raw body text

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **Promise-based** - Modern async/await support
- **Fluent API** - Chainable method calls
- **15M+ downloads/week** - Industry standard for HTTP testing

## License

MIT
