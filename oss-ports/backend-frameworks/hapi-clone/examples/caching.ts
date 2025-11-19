/**
 * Caching Example for Hapi Clone
 */

import Hapi from '../src/hapi.ts';

const server = Hapi.server({ port: 3400, host: 'localhost' });

const cache = new Map<string, any>();

server.route({
  method: 'GET',
  path: '/cached-data',
  options: {
    cache: { expiresIn: 60000 }
  },
  handler: (request: any, h: any) => {
    const cacheKey = 'cached-data';
    
    if (cache.has(cacheKey)) {
      return h.response(cache.get(cacheKey))
        .header('X-Cache', 'HIT');
    }
    
    const data = {
      message: 'Fresh data',
      timestamp: new Date().toISOString()
    };
    
    cache.set(cacheKey, data);
    
    return h.response(data)
      .header('X-Cache', 'MISS');
  }
});

await server.start();
console.log('Hapi Caching on', server.info.uri);
