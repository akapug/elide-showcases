/**
 * Advanced Routing Example for Koa Clone
 */

import Koa from '../src/koa.ts';

const app = new Koa();

// Manual router implementation
const routes = new Map();

function route(method: string, path: string, handler: any) {
  const key = `${method}:${path}`;
  routes.set(key, handler);
}

// Define routes
route('GET', '/', async (ctx: any) => {
  ctx.body = { message: 'Home', routes: Array.from(routes.keys()) };
});

route('GET', '/users', async (ctx: any) => {
  ctx.body = {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  };
});

route('GET', '/users/:id', async (ctx: any) => {
  const id = ctx.state.params.id;
  ctx.body = { userId: id, name: `User ${id}` };
});

route('POST', '/users', async (ctx: any) => {
  ctx.body = { created: true, user: ctx.request.body };
  ctx.status = 201;
});

route('PUT', '/users/:id', async (ctx: any) => {
  const id = ctx.state.params.id;
  ctx.body = { updated: true, userId: id, data: ctx.request.body };
});

route('DELETE', '/users/:id', async (ctx: any) => {
  const id = ctx.state.params.id;
  ctx.body = { deleted: true, userId: id };
});

// Nested resources
route('GET', '/posts/:postId/comments', async (ctx: any) => {
  const postId = ctx.state.params.postId;
  ctx.body = {
    postId,
    comments: [
      { id: 1, text: 'Great post!' },
      { id: 2, text: 'Thanks for sharing' }
    ]
  };
});

route('POST', '/posts/:postId/comments', async (ctx: any) => {
  const postId = ctx.state.params.postId;
  ctx.body = {
    created: true,
    postId,
    comment: ctx.request.body
  };
  ctx.status = 201;
});

// Route matching middleware
app.use(async (ctx, next) => {
  const path = ctx.path;
  const method = ctx.method;

  // Parse params from path
  for (const [routeKey, handler] of routes) {
    const [routeMethod, routePath] = routeKey.split(':');

    if (routeMethod !== method) continue;

    const paramNames: string[] = [];
    const pattern = routePath.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);

    if (match) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });

      ctx.state.params = params;
      await handler(ctx);
      return;
    }
  }

  await next();
});

// 404 handler
app.use(async ctx => {
  ctx.status = 404;
  ctx.body = { error: 'Not Found', path: ctx.path };
});

app.listen(3010, () => {
  console.log('Advanced routing example on http://localhost:3010');
  console.log('\nRoutes:');
  Array.from(routes.keys()).forEach(route => {
    console.log(`  ${route}`);
  });
});
