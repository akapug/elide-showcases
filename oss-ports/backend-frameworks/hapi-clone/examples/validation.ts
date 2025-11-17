/**
 * Validation Example for Hapi Clone
 */

import Hapi from '../src/hapi.ts';

const server = Hapi.server({ port: 3400, host: 'localhost' });

server.route({
  method: 'POST',
  path: '/users',
  options: {
    validate: {
      payload: {
        email: { type: 'string', required: true },
        username: { type: 'string', min: 3, max: 20 },
        age: { type: 'number', min: 13 }
      }
    }
  },
  handler: (request: any, h: any) => {
    return h.response({ user: request.payload }).code(201);
  }
});

await server.start();
console.log('Hapi Validation on', server.info.uri);
