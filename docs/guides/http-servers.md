# Building HTTP Servers with Elide

**Comprehensive guide to creating production-ready HTTP servers**

Learn how to build fast, scalable HTTP servers using Elide's native HTTP support with both Fetch handlers and Node.js APIs.

---

## Table of Contents

- [Server Patterns](#server-patterns)
- [Fetch Handler API](#fetch-handler-api)
- [Node.js HTTP API](#nodejs-http-api)
- [Routing](#routing)
- [Middleware](#middleware)
- [Request Handling](#request-handling)
- [Response Patterns](#response-patterns)
- [Error Handling](#error-handling)
- [CORS and Security](#cors-and-security)
- [Performance Optimization](#performance-optimization)

---

## Server Patterns

### Pattern 1: Fetch Handler (Recommended)

**Best for**: Modern APIs, serverless, edge deployments

```typescript
// server.ts
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/") {
    return new Response("Welcome to Elide!");
  }

  if (url.pathname === "/api/data") {
    return new Response(JSON.stringify({ data: "value" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}

if (import.meta.url.includes("server.ts")) {
  console.log("Server running on http://localhost:3000");
}
```

**Benefits**:
- Fastest cold start (~20ms)
- Web-standard API (portable)
- Simple and declarative
- Works great with edge deployments

### Pattern 2: Node.js HTTP API

**Best for**: Complex servers, streaming, WebSocket upgrade

```typescript
// server.ts
import { createServer } from "http";

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Welcome to Elide!");
    return;
  }

  if (url.pathname === "/api/data") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: "value" }));
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Benefits**:
- Full Node.js compatibility
- Streaming support
- Connection management
- Familiar to Node.js developers

---

## Fetch Handler API

### Basic Structure

```typescript
export default async function fetch(req: Request): Promise<Response> {
  // Access request properties
  const method = req.method;
  const url = new URL(req.url);
  const headers = req.headers;

  // Parse request body
  const body = await req.json();  // or .text(), .formData(), .arrayBuffer()

  // Return response
  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" }
  });
}
```

### Request Methods

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  switch (req.method) {
    case "GET":
      return handleGet(req, path);
    case "POST":
      return handlePost(req, path);
    case "PUT":
      return handlePut(req, path);
    case "DELETE":
      return handleDelete(req, path);
    case "OPTIONS":
      return handleOptions(req);
    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
}

async function handleGet(req: Request, path: string): Promise<Response> {
  if (path === "/users") {
    return new Response(JSON.stringify([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" }
    ]), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}

async function handlePost(req: Request, path: string): Promise<Response> {
  if (path === "/users") {
    const user = await req.json();
    return new Response(JSON.stringify({ id: 3, ...user }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

### Query Parameters

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Get single parameter
  const search = url.searchParams.get("q") || "";

  // Get all parameters
  const params = Object.fromEntries(url.searchParams.entries());

  // Multiple values
  const tags = url.searchParams.getAll("tag");

  return new Response(JSON.stringify({
    search,
    params,
    tags
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

// Usage: GET /search?q=elide&tag=fast&tag=polyglot&limit=10
```

### Path Parameters

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Match /users/:id
  const userMatch = path.match(/^\/users\/([^/]+)$/);
  if (userMatch && req.method === "GET") {
    const userId = userMatch[1];
    return new Response(JSON.stringify({ id: userId, name: "Alice" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Match /posts/:postId/comments/:commentId
  const commentMatch = path.match(/^\/posts\/([^/]+)\/comments\/([^/]+)$/);
  if (commentMatch && req.method === "GET") {
    const [, postId, commentId] = commentMatch;
    return new Response(JSON.stringify({ postId, commentId, text: "Great post!" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Node.js HTTP API

### Basic Server

```typescript
import { createServer, IncomingMessage, ServerResponse } from "http";

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  // Parse URL
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // Simple routing
  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Home");
    return;
  }

  if (url.pathname === "/api/data") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: [1, 2, 3] }));
    return;
  }

  // 404
  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
```

### Request Body Parsing

```typescript
import { createServer } from "http";

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/users") {
    let body = "";

    // Collect data
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Process complete body
    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: Date.now(), ...data }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000);
```

### Streaming Responses

```typescript
import { createServer } from "http";

const server = createServer((req, res) => {
  if (req.url === "/stream") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked"
    });

    // Stream data in chunks
    let count = 0;
    const interval = setInterval(() => {
      res.write(`Chunk ${count}\n`);
      count++;

      if (count >= 10) {
        clearInterval(interval);
        res.end("Done!");
      }
    }, 100);

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000);
```

---

## Routing

### Simple Router Class

```typescript
// router.ts
type Handler = (req: Request, params: Record<string, string>) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  add(method: string, path: string, handler: Handler) {
    const keys: string[] = [];
    const pattern = new RegExp(
      "^" + path.replace(/:(\w+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      }) + "$"
    );

    this.routes.push({ method, pattern, keys, handler });
  }

  get(path: string, handler: Handler) {
    this.add("GET", path, handler);
  }

  post(path: string, handler: Handler) {
    this.add("POST", path, handler);
  }

  put(path: string, handler: Handler) {
    this.add("PUT", path, handler);
  }

  delete(path: string, handler: Handler) {
    this.add("DELETE", path, handler);
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.keys.forEach((key, i) => {
          params[key] = match[i + 1];
        });

        return route.handler(req, params);
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}
```

### Router Usage

```typescript
// server.ts
import { Router } from "./router.ts";

const router = new Router();

// Define routes
router.get("/", async () => {
  return new Response("Home");
});

router.get("/users", async () => {
  return new Response(JSON.stringify([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ]), {
    headers: { "Content-Type": "application/json" }
  });
});

router.get("/users/:id", async (req, params) => {
  return new Response(JSON.stringify({
    id: params.id,
    name: "Alice"
  }), {
    headers: { "Content-Type": "application/json" }
  });
});

router.post("/users", async (req) => {
  const user = await req.json();
  return new Response(JSON.stringify({
    id: Date.now(),
    ...user
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
});

router.delete("/users/:id", async (req, params) => {
  return new Response(JSON.stringify({
    deleted: params.id
  }), {
    headers: { "Content-Type": "application/json" }
  });
});

// Export fetch handler
export default async function fetch(req: Request): Promise<Response> {
  return router.handle(req);
}

if (import.meta.url.includes("server.ts")) {
  console.log("Server running on http://localhost:3000");
}
```

---

## Middleware

### Middleware Pattern

```typescript
type Handler = (req: Request) => Promise<Response>;
type Middleware = (req: Request, next: Handler) => Promise<Response>;

function compose(...middlewares: Middleware[]): Middleware {
  return async (req: Request, next: Handler): Promise<Response> => {
    let index = 0;

    const dispatch = async (): Promise<Response> => {
      if (index >= middlewares.length) {
        return next(req);
      }

      const middleware = middlewares[index++];
      return middleware(req, dispatch);
    };

    return dispatch();
  };
}

// Logger middleware
const logger: Middleware = async (req, next) => {
  const start = Date.now();
  const response = await next(req);
  const duration = Date.now() - start;

  console.log(`${req.method} ${new URL(req.url).pathname} - ${response.status} (${duration}ms)`);

  return response;
};

// Auth middleware
const auth: Middleware = async (req, next) => {
  const token = req.headers.get("Authorization");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Validate token
  if (token !== "Bearer valid-token") {
    return new Response("Invalid token", { status: 401 });
  }

  return next(req);
};

// CORS middleware
const cors: Middleware = async (req, next) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  const response = await next(req);
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    headers
  });
};

// Usage
const handler = compose(logger, cors, auth);

export default async function fetch(req: Request): Promise<Response> {
  return handler(req, async (req) => {
    // Your route handling here
    return new Response("Protected resource");
  });
}
```

---

## Request Handling

### JSON Body

```typescript
export default async function fetch(req: Request): Promise<Response> {
  if (req.method === "POST") {
    try {
      const data = await req.json();

      // Validate
      if (!data.name || !data.email) {
        return new Response(JSON.stringify({
          error: "Missing required fields"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Invalid JSON"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
}
```

### File Upload

```typescript
export default async function fetch(req: Request): Promise<Response> {
  if (req.method === "POST" && req.url.includes("/upload")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response("No file uploaded", { status: 400 });
    }

    // Process file
    const buffer = await file.arrayBuffer();
    const size = buffer.byteLength;

    return new Response(JSON.stringify({
      filename: file.name,
      size,
      type: file.type
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Response Patterns

### JSON Response Helper

```typescript
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/users") {
    return jsonResponse([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" }
    ]);
  }

  if (url.pathname === "/error") {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }

  return jsonResponse({ error: "Not Found" }, 404);
}
```

### Redirect

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/old-page") {
    return new Response(null, {
      status: 301,
      headers: { "Location": "/new-page" }
    });
  }

  if (url.pathname === "/new-page") {
    return new Response("New page!");
  }

  return new Response("Not Found", { status: 404 });
}
```

### Cache Control

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/static/data.json") {
    return new Response(JSON.stringify({ data: "cached" }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",  // Cache for 1 hour
        "ETag": "\"v1.0\""
      }
    });
  }

  if (url.pathname === "/dynamic") {
    return new Response(JSON.stringify({ timestamp: Date.now() }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Error Handling

### Global Error Handler

```typescript
export default async function fetch(req: Request): Promise<Response> {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Error:", error);

    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({
        error: error.message,
        code: "VALIDATION_ERROR"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (error instanceof NotFoundError) {
      return new Response(JSON.stringify({
        error: error.message,
        code: "NOT_FOUND"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      error: "Internal Server Error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/users/:id") {
    // May throw NotFoundError
    const user = await getUserById(id);
    return new Response(JSON.stringify(user));
  }

  throw new NotFoundError("Route not found");
}
```

---

## CORS and Security

### Complete CORS Implementation

```typescript
function corsHeaders(origin: string = "*"): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"  // 24 hours
  };
}

export default async function fetch(req: Request): Promise<Response> {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  // Process request
  const response = await handleRequest(req);

  // Add CORS headers
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
```

### Security Headers

```typescript
function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'"
  };
}

export default async function fetch(req: Request): Promise<Response> {
  const response = await handleRequest(req);

  const headers = new Headers(response.headers);
  Object.entries(securityHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
```

---

## Performance Optimization

### Pre-compute Static Responses

```typescript
// Pre-compute at module load time
const HEALTH_RESPONSE = new Response(JSON.stringify({ status: "healthy" }), {
  headers: { "Content-Type": "application/json" }
});

const NOT_FOUND_RESPONSE = new Response(JSON.stringify({ error: "Not Found" }), {
  status: 404,
  headers: { "Content-Type": "application/json" }
});

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return HEALTH_RESPONSE.clone();  // Clone to reuse
  }

  return NOT_FOUND_RESPONSE.clone();
}
```

### Route Caching

```typescript
const routeCache = new Map<string, Response>();

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const cacheKey = `${req.method}:${url.pathname}`;

  // Check cache
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!.clone();
  }

  // Generate response
  const response = await handleRequest(req);

  // Cache if cacheable
  if (response.status === 200 && req.method === "GET") {
    routeCache.set(cacheKey, response.clone());
  }

  return response;
}
```

---

## Next Steps

- **[Performance Optimization](./performance-optimization.md)** - Server performance
- **[Testing](./testing.md)** - Test HTTP servers
- **[Deployment](./deployment.md)** - Deploy to production
- **[Security](./security.md)** - Secure your servers

---

## Summary

**Elide HTTP Server Capabilities:**

- ✅ **Two patterns**: Fetch handler (modern) and Node.js API (compatible)
- ✅ **Fast cold start**: ~20ms
- ✅ **High throughput**: 50,000+ req/s
- ✅ **Web-standard APIs**: Portable to edge/serverless
- ✅ **Full routing**: Path parameters, query strings, middleware
- ✅ **Request handling**: JSON, form data, file uploads
- ✅ **Security**: CORS, headers, authentication

🚀 **Build production-ready HTTP servers with Elide!**
