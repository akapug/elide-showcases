# Migrating from Node.js to Elide

**Step-by-step guide to migrate your Node.js applications to Elide**

This guide helps Node.js developers transition to Elide, covering API compatibility, common patterns, and migration strategies.

---

## Table of Contents

- [Why Migrate to Elide?](#why-migrate-to-elide)
- [Key Differences](#key-differences)
- [API Compatibility](#api-compatibility)
- [Migration Strategy](#migration-strategy)
- [Common Patterns](#common-patterns)
- [Package Migration](#package-migration)
- [Testing Migration](#testing-migration)
- [Deployment Changes](#deployment-changes)

---

## Why Migrate to Elide?

### Performance Benefits

| Metric | Node.js | Elide | Improvement |
|--------|---------|-------|-------------|
| **Cold Start** | ~200ms | ~20ms | **10x faster** |
| **Memory** | 200-500MB | 50-200MB | **2-4x less** |
| **Peak Performance** | Baseline | 1-2x faster | **Better** |
| **Startup Dependencies** | npm install required | Zero dependencies | **Instant** |

### Additional Benefits

- **Polyglot**: Add Python/Ruby/Java code without microservices
- **Zero Dependencies**: No node_modules, no package.json
- **Type Safety**: Native TypeScript support
- **Modern APIs**: Web standards (fetch, Request, Response)
- **Smaller Deployments**: No node_modules to ship

---

## Key Differences

### 1. No npm Packages

**Node.js**:
```bash
npm install express uuid dotenv
```

**Elide**:
```typescript
// No installation - use built-in APIs or inline code
```

### 2. Web-Standard APIs

**Node.js**:
```javascript
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello');
});
```

**Elide** (Option 1 - Web Standard):
```typescript
export default async function fetch(req: Request): Promise<Response> {
  return new Response('Hello');
}
```

**Elide** (Option 2 - Node.js Compatible):
```typescript
import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello');
});

server.listen(3000);
```

### 3. Module System

**Node.js** (CommonJS):
```javascript
const express = require('express');
const { v4: uuid } = require('uuid');

module.exports = { myFunction };
```

**Elide** (ES Modules):
```typescript
import { createServer } from "http";
import { v4 as uuid } from "./uuid.ts";  // Local file

export { myFunction };
```

### 4. File System Access

**Node.js**:
```javascript
const fs = require('fs');
const data = fs.readFileSync('file.txt', 'utf8');
```

**Elide** (use Fetch API or limited fs):
```typescript
// Use fetch for external files
const data = await fetch('https://example.com/file.txt').then(r => r.text());

// Or implement custom file reading if needed
```

---

## API Compatibility

### Supported Node.js APIs

Elide supports a **subset** of Node.js APIs:

#### ✅ Fully Supported

```typescript
// HTTP module
import { createServer } from "http";
import { request, get } from "http";

// Crypto module (basic)
import { createHash, randomBytes } from "crypto";

// Path module
import { join, resolve, dirname, basename } from "path";

// URL module
import { URL, URLSearchParams } from "url";

// Process
process.env.NODE_ENV
process.argv
process.cwd()

// Console
console.log, console.error, console.warn
```

#### ⚠️ Partially Supported

```typescript
// FS module (limited)
import { readFileSync, writeFileSync } from "fs";
// But prefer fetch API or alternatives

// Buffer (basic operations)
Buffer.from(), Buffer.toString()
```

#### ❌ Not Supported

```typescript
// Complex npm packages
// require('express')
// require('socket.io')
// require('mongoose')

// Native addons
// require('./build/Release/native.node')

// Child processes
// require('child_process')

// Streams (advanced)
// require('stream')
```

### Web Standard Alternatives

Use **Web APIs** instead of Node.js-specific APIs:

| Node.js API | Elide Alternative |
|-------------|-------------------|
| `http.request()` | `fetch()` |
| `fs.readFile()` | `fetch()` for URLs |
| `Buffer` | `Uint8Array`, `TextEncoder/TextDecoder` |
| `setTimeout()` | `setTimeout()` (same) |
| `setInterval()` | `setInterval()` (same) |
| `Promise` | `Promise` (same) |
| `async/await` | `async/await` (same) |

---

## Migration Strategy

### Step 1: Assess Your Application

**Inventory your dependencies**:

```bash
# Check package.json
cat package.json | jq '.dependencies'

# Categorize dependencies:
# 1. Standard library (http, crypto, path) - ✅ Supported
# 2. Pure JavaScript utilities (lodash, uuid) - ⚠️ Inline or rewrite
# 3. Native addons (bcrypt, sharp) - ❌ Need alternatives
# 4. Frameworks (express, fastify) - ⚠️ Rewrite with native http
```

**Example analysis**:

```json
{
  "dependencies": {
    "express": "^4.18.0",      // ❌ Rewrite
    "uuid": "^9.0.0",          // ✅ Inline
    "lodash": "^4.17.21",      // ✅ Inline functions
    "dotenv": "^16.0.0",       // ✅ Inline
    "bcrypt": "^5.1.0",        // ❌ Use Web Crypto
    "mysql2": "^3.0.0"         // ⚠️ Needs DB strategy
  }
}
```

### Step 2: Create Elide Project Structure

```bash
mkdir my-elide-app
cd my-elide-app

# Create source structure
mkdir -p src/{handlers,utils,types}
```

**Project structure**:

```
my-elide-app/
├── src/
│   ├── server.ts          # Main entry point
│   ├── handlers/          # Request handlers
│   │   ├── users.ts
│   │   └── posts.ts
│   ├── utils/             # Utility functions
│   │   ├── uuid.ts
│   │   ├── validation.ts
│   │   └── crypto.ts
│   └── types/             # TypeScript types
│       └── index.ts
└── README.md
```

### Step 3: Migrate Server Setup

**Node.js/Express**:

```javascript
// server.js
const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id, name: 'Alice' });
});

app.post('/users', (req, res) => {
  const user = req.body;
  res.status(201).json({ id: '123', ...user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Elide (Fetch Handler)**:

```typescript
// server.ts
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Health check
  if (path === '/health' && method === 'GET') {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user
  if (path.startsWith('/users/') && method === 'GET') {
    const id = path.split('/')[2];
    return new Response(JSON.stringify({ id, name: 'Alice' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create user
  if (path === '/users' && method === 'POST') {
    const user = await req.json();
    return new Response(JSON.stringify({ id: '123', ...user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { status: 404 });
}

if (import.meta.url.includes('server.ts')) {
  console.log('Server running on http://localhost:3000');
}
```

**Elide (Node.js http API)**:

```typescript
// server.ts
import { createServer } from "http";

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // Health check
  if (path === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }

  // Get user
  if (path.startsWith('/users/') && method === 'GET') {
    const id = path.split('/')[2];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id, name: 'Alice' }));
    return;
  }

  // Create user
  if (path === '/users' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const user = JSON.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: '123', ...user }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Step 4: Migrate Utilities

**UUID (from npm package to inline)**:

```typescript
// utils/uuid.ts
export function v4(): string {
  const hex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    '4' + hex.substring(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.substring(17, 20),
    hex.substring(20, 32)
  ].join('-');
}

export function validate(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}
```

**Dotenv (environment variables)**:

```typescript
// utils/env.ts
export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || ''
};

// Usage
import { config } from './utils/env.ts';
console.log(`Starting on port ${config.port}`);
```

**Bcrypt → Web Crypto API**:

```typescript
// utils/crypto.ts
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Note: For production, consider using a proper password hashing library
// or implement PBKDF2/Argon2 using Web Crypto API
```

### Step 5: Migrate Routing

**Express routing → Manual routing**:

Create a routing helper:

```typescript
// utils/router.ts
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
    // Convert /users/:id to regex
    const keys: string[] = [];
    const pattern = new RegExp(
      '^' + path.replace(/:(\w+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      }) + '$'
    );

    this.routes.push({ method, pattern, keys, handler });
  }

  get(path: string, handler: Handler) {
    this.add('GET', path, handler);
  }

  post(path: string, handler: Handler) {
    this.add('POST', path, handler);
  }

  put(path: string, handler: Handler) {
    this.add('PUT', path, handler);
  }

  delete(path: string, handler: Handler) {
    this.add('DELETE', path, handler);
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

    return new Response('Not Found', { status: 404 });
  }
}
```

**Usage**:

```typescript
// server.ts
import { Router } from './utils/router.ts';

const router = new Router();

router.get('/health', async () => {
  return new Response(JSON.stringify({ status: 'healthy' }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/users/:id', async (req, params) => {
  return new Response(JSON.stringify({ id: params.id, name: 'Alice' }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/users', async (req) => {
  const user = await req.json();
  return new Response(JSON.stringify({ id: '123', ...user }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
});

export default async function fetch(req: Request): Promise<Response> {
  return router.handle(req);
}
```

---

## Common Patterns

### Middleware Pattern

**Express middleware**:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

**Elide equivalent**:
```typescript
type Handler = (req: Request) => Promise<Response>;
type Middleware = (req: Request, next: Handler) => Promise<Response>;

function compose(...middlewares: Middleware[]): Handler {
  return async (req: Request): Promise<Response> => {
    let index = 0;

    const next = async (): Promise<Response> => {
      if (index >= middlewares.length) {
        return new Response('Not Found', { status: 404 });
      }

      const middleware = middlewares[index++];
      return middleware(req, next);
    };

    return next();
  };
}

// Usage
const logger: Middleware = async (req, next) => {
  console.log(`${req.method} ${new URL(req.url).pathname}`);
  return next(req);
};

const auth: Middleware = async (req, next) => {
  const token = req.headers.get('Authorization');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  return next(req);
};

const handler = compose(logger, auth);
```

### CORS Middleware

```typescript
// utils/cors.ts
export function cors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return new Response(response.body, {
    status: response.status,
    headers
  });
}

// Usage
export default async function fetch(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return cors(new Response(null, { status: 204 }));
  }

  const response = await handleRequest(req);
  return cors(response);
}
```

### Error Handling

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

export function errorHandler(error: unknown): Response {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return new Response(JSON.stringify({
      error: error.message,
      code: error.code
    }), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    error: 'Internal Server Error'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Usage
export default async function fetch(req: Request): Promise<Response> {
  try {
    return await handleRequest(req);
  } catch (error) {
    return errorHandler(error);
  }
}
```

---

## Package Migration

### Common npm Packages

| npm Package | Elide Alternative |
|-------------|-------------------|
| `uuid` | Inline implementation |
| `dotenv` | `process.env` directly |
| `lodash` | Inline specific functions |
| `axios` | `fetch()` API |
| `moment` | `Date` + `Intl.DateTimeFormat` |
| `express` | Native http + routing helper |
| `body-parser` | `req.json()` / `req.text()` |
| `cors` | Custom middleware |
| `helmet` | Custom security headers |
| `morgan` | Custom logging middleware |

### Example: Lodash Functions

```typescript
// utils/lodash.ts

// _.chunk
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// _.debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// _.groupBy
export function groupBy<T>(
  array: T[],
  fn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const key = fn(item);
    (result[key] = result[key] || []).push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// _.uniq
export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}
```

---

## Testing Migration

### Jest → Elide Testing

**Node.js/Jest**:
```javascript
const request = require('supertest');
const app = require('./app');

describe('API Tests', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
```

**Elide**:
```typescript
// tests/api.test.ts
import { fetch as handler } from '../src/server.ts';

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

async function testHealthEndpoint() {
  const req = new Request('http://localhost:3000/health');
  const res = await handler(req);

  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }

  const data = await res.json();
  if (data.status !== 'healthy') {
    throw new Error(`Expected healthy, got ${data.status}`);
  }
}

// Run tests
test('Health endpoint returns 200', testHealthEndpoint);
```

---

## Deployment Changes

### Docker

**Node.js Dockerfile**:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**Elide Dockerfile**:
```dockerfile
FROM ghcr.io/elide-dev/elide:latest
WORKDIR /app
COPY src/ ./src/
EXPOSE 3000
CMD ["elide", "run", "src/server.ts"]
```

### Environment Variables

Both Node.js and Elide use `process.env`:

```typescript
const PORT = parseInt(process.env.PORT || '3000');
const API_KEY = process.env.API_KEY || '';
```

---

## Next Steps

- **[Polyglot Programming](./polyglot-programming.md)** - Add Python/Ruby to your app
- **[HTTP Servers](./http-servers.md)** - Advanced HTTP patterns
- **[Testing Guide](./testing.md)** - Comprehensive testing strategies
- **[Deployment Guide](./deployment.md)** - Production deployment

---

## Summary

**Migration Checklist:**

- ✅ Assess dependencies (categorize as supported/inline/rewrite)
- ✅ Create Elide project structure
- ✅ Migrate server setup (Fetch handler or Node.js http)
- ✅ Inline utility functions (uuid, dotenv, lodash)
- ✅ Implement routing (manual or helper)
- ✅ Update middleware patterns
- ✅ Migrate tests
- ✅ Update deployment scripts

**Benefits After Migration:**
- **10x faster** cold starts
- **2-4x less** memory usage
- **Zero dependencies** - no node_modules
- **Polyglot capable** - add Python/Ruby/Java
- **Smaller deployments** - no packages to ship

🚀 **Ready to migrate? Start with a small service and expand!**
