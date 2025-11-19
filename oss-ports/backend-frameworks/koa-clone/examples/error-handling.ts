import Koa from '../src/koa.ts';

const app = new Koa();

// Global error handler
app.on('error', (err, ctx) => {
  console.error('Server error:', err);
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: true,
      message: err.expose ? err.message : 'Internal Server Error',
      status: err.status || 500
    };
  }
});

app.use(async ctx => {
  if (ctx.path === '/error') {
    ctx.throw(500, 'Intentional error');
  } else if (ctx.path === '/unauthorized') {
    ctx.throw(401, 'Unauthorized');
  } else if (ctx.path === '/assert') {
    ctx.assert(false, 400, 'Assertion failed');
  } else {
    ctx.body = { message: 'OK' };
  }
});

app.listen(3002);
