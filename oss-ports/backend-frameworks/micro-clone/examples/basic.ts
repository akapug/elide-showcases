import micro, { send, json, Router } from '../src/micro.ts';

// Simple handler
const simpleHandler = async (req, res) => {
  return { message: 'Hello from Micro!', timestamp: Date.now() };
};

// With router
const router = new Router();

router.get('/', async (req, res) => {
  return { message: 'Home' };
});

router.post('/data', async (req, res) => {
  const body = await json(req);
  return { received: body };
});

const server = micro(router.handler());
server.listen(3000);
