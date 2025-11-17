import Hapi from '../src/hapi.ts';

const server = Hapi.server({ port: 3000 });

server.route([
  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return { message: 'Hello Hapi!' };
    }
  },
  {
    method: 'GET',
    path: '/users/{id}',
    handler: (request, h) => {
      return { userId: request.params.id };
    },
    options: {
      validate: {
        params: {
          type: 'object',
          required: ['id']
        }
      }
    }
  }
]);

await server.start();
