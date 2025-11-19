/**
 * Plugins Example for Restify Clone
 */

import restify from '../src/restify.ts';

const server = restify.createServer({ name: 'plugins-api' });

// Custom plugin
function requestLogger(options: any) {
  return (req: any, res: any, next: any) => {
    console.log(`${req.method} ${req.url}`);
    next();
  };
}

server.use(requestLogger({}));

server.get('/test', (req, res, next) => {
  res.send({ message: 'Plugin demo' });
});

server.listen(3600, () => {
  console.log('Restify Plugins on :3600');
});
