import Koa from '../src/koa.ts';

const app = new Koa();

// Error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
    ctx.app.emit('error', err, ctx);
  }
});

// Logger
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(`${ctx.method} ${ctx.url} - ${Date.now() - start}ms`);
});

// Auth middleware
app.use(async (ctx, next) => {
  const token = ctx.get('authorization');
  if (token === 'Bearer secret-token') {
    ctx.state.user = { id: 1, name: 'Admin' };
  }
  await next();
});

// Routes
app.use(async ctx => {
  if (ctx.path === '/') {
    ctx.body = { message: 'Home' };
  } else if (ctx.path === '/protected') {
    ctx.assert(ctx.state.user, 401, 'Authentication required');
    ctx.body = { user: ctx.state.user, data: 'Protected content' };
  } else {
    ctx.throw(404, 'Not found');
  }
});

app.listen(3001);
