import Koa from '../src/koa.ts';

const app = new Koa();

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${duration}ms`);
});

// Response middleware
app.use(async ctx => {
  if (ctx.path === '/') {
    ctx.body = { message: 'Hello World', timestamp: Date.now() };
  } else if (ctx.path === '/users') {
    ctx.body = { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] };
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Not Found' };
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
