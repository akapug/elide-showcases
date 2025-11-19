/**
 * JSON API Example for Micro Clone
 */

import micro, { send, json } from '../src/micro.ts';

const items: any[] = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
];

const handler = micro(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  
  if (req.method === 'GET' && url.pathname === '/items') {
    return send(res, 200, { items });
  }
  
  if (req.method === 'POST' && url.pathname === '/items') {
    const body = await json(req);
    const item = { id: items.length + 1, ...body };
    items.push(item);
    return send(res, 201, { item });
  }
  
  return send(res, 404, { error: 'Not found' });
});

handler.listen(4100);
console.log('Micro JSON API on :4100');
