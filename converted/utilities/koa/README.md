# Koa - Next Generation Web Framework

Expressive HTTP middleware framework for Node.js - converted for Elide.

## Overview

Koa is a new web framework designed by the team behind Express, aiming to be a smaller, more expressive, and more robust foundation for web applications and APIs. This Elide conversion brings Koa's elegant async/await middleware pattern to all polyglot languages.

**Based on**: [koa](https://www.npmjs.com/package/koa) (~9M downloads/week on npm)

## Features

- ✅ **Async/await middleware** - Modern asynchronous programming
- ✅ **Context object** - Encapsulates request and response
- ✅ **Cascade middleware** - Powerful middleware composition
- ✅ **Error handling** - Built-in try/catch support
- ✅ **Minimal footprint** - No bundled middleware
- ✅ **Zero dependencies** - Pure TypeScript implementation

## Polyglot Benefits

- **Python, Ruby, Java** - Use same middleware pattern across all languages
- **Consistent API** - One async pattern everywhere on Elide
- **Share Logic** - Reuse middleware across your polyglot stack
- **Type Safety** - Full TypeScript support

## Usage

```typescript
import { Koa } from "./elide-koa.ts";

const app = new Koa();

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.req.method} ${ctx.req.url} - ${ms}ms`);
});

// Response middleware
app.use(async (ctx) => {
  ctx.res.status = 200;
  ctx.res.body = { message: "Hello Koa!" };
});

// Handle request
const response = await app.callback({
  method: "GET",
  url: "/",
  headers: {},
});
```

## Examples

### Error Handling

```typescript
app.use(async (ctx) => {
  ctx.throw(401, "Unauthorized");
});
```

### Context State

```typescript
app.use(async (ctx, next) => {
  ctx.state.user = { id: 1, name: "Alice" };
  await next();
});

app.use(async (ctx) => {
  ctx.res.body = { user: ctx.state.user };
});
```

## Use Cases

- Modern REST APIs with async/await
- Microservices with clean middleware
- GraphQL servers
- Backend-for-frontend (BFF) patterns

## Performance

- Zero dependencies
- Minimal footprint
- Clean middleware architecture
- ~9M downloads/week on npm

## Running the Demo

```bash
elide run elide-koa.ts
```

## Learn More

- [Koa Documentation](https://koajs.com/)
- [Elide Documentation](https://docs.elide.dev/)
