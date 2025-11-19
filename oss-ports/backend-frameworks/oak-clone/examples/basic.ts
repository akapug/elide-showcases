import { Application, Router } from '../src/oak.ts';

const app = new Application();
const router = new Router();

router.get('/', (ctx) => {
  ctx.response.body = { message: 'Home' };
});

router.get('/users/:id', (ctx: any) => {
  ctx.response.body = { userId: ctx.params.id };
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 3000 });
