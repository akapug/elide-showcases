/**
 * Routing Example for Micro Clone
 */

import micro, { send, Router } from '../src/micro.ts';

const router = new Router();

router.get('/', async (req, res) => {
  return send(res, 200, { message: 'Micro routing demo' });
});

router.get('/users/:id', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const id = url.pathname.split('/')[2];
  
  return send(res, 200, { user: { id, name: `User ${id}` } });
});

router.post('/data', async (req, res) => {
  return send(res, 201, { message: 'Data created' });
});

const handler = micro(router.handler());

handler.listen(4100);
console.log('Micro Routing on :4100');
