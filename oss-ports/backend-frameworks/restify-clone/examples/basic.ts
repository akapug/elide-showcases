import restify from '../src/restify.ts';

const server = restify.createServer({
  name: 'api-server',
  version: ['1.0.0', '2.0.0'],
  throttle: { burst: 100, rate: 50, ip: true }
});

// v1 endpoint
server.get({ path: '/users/:id', version: '1.0.0' }, (req, res, next) => {
  res.send({ id: req.params.id, version: '1.0.0' });
});

// v2 endpoint (enhanced)
server.get({ path: '/users/:id', version: '2.0.0' }, (req, res, next) => {
  res.send({ id: req.params.id, name: `User ${req.params.id}`, version: '2.0.0' });
});

server.listen(3000);
