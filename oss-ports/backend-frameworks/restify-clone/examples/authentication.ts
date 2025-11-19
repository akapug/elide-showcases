/**
 * Authentication Example for Restify Clone
 */

import restify from '../src/restify.ts';

const server = restify.createServer({ name: 'auth-api' });

server.post('/auth/login', (req, res, next) => {
  const { username, password } = req.body || {};
  
  if (username === 'admin' && password === 'admin123') {
    res.send({ token: 'jwt-token-here', user: { username, role: 'admin' } });
  } else {
    res.send(401, { error: 'Invalid credentials' });
  }
});

server.listen(3600, () => {
  console.log('Restify Authentication on :3600');
});
