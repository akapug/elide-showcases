/**
 * Error Handling Example for Micro Clone
 */

import micro, { send, createError } from '../src/micro.ts';

const handler = micro(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  
  if (url.pathname === '/error') {
    throw createError(500, 'Something went wrong');
  }
  
  if (url.pathname === '/not-found') {
    throw createError(404, 'Resource not found');
  }
  
  return send(res, 200, { message: 'No errors here' });
});

handler.listen(4100);
console.log('Micro Error Handling on :4100');
