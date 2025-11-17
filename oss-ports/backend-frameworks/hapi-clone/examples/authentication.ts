/**
 * Authentication Example for Hapi Clone
 */

import Hapi from '../src/hapi.ts';

const server = Hapi.server({ port: 3400, host: 'localhost' });

// Simple auth strategy
server.auth.strategy('simple', 'bearer-token', {
  validate: async (token: string) => {
    if (token === 'valid-token') {
      return { isValid: true, credentials: { user: 'testuser' } };
    }
    return { isValid: false };
  }
});

server.route({
  method: 'GET',
  path: '/protected',
  options: {
    auth: 'simple'
  },
  handler: (request: any, h: any) => {
    return { message: 'Protected resource', user: request.auth.credentials };
  }
});

await server.start();
console.log('Hapi Authentication on', server.info.uri);
