/**
 * Plugin System Example
 *
 * Demonstrates the plugin architecture and how to extend Fastify
 */

import fastify from '../src/fastify.ts';

const app = fastify({ logger: true });

// ==================== DATABASE PLUGIN ====================

interface DbPlugin {
  query(sql: string): Promise<any[]>;
  insert(table: string, data: any): Promise<any>;
  update(table: string, id: number, data: any): Promise<any>;
  delete(table: string, id: number): Promise<void>;
}

const databasePlugin = async (fastify: any, options: any) => {
  // Simulate database connection
  const db: DbPlugin = {
    async query(sql: string) {
      // Simulate database query
      return [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
    },
    async insert(table: string, data: any) {
      return { id: Math.floor(Math.random() * 1000), ...data };
    },
    async update(table: string, id: number, data: any) {
      return { id, ...data };
    },
    async delete(table: string, id: number) {
      // Simulate deletion
    }
  };

  // Decorate fastify instance with db
  fastify.decorate('db', db);

  fastify.log.info('Database plugin loaded');
};

// ==================== AUTH PLUGIN ====================

const authPlugin = async (fastify: any, options: any) => {
  const { secret = 'default-secret' } = options;

  // Add auth utilities
  fastify.decorate('auth', {
    generateToken(userId: number): string {
      return `token-${userId}-${Date.now()}`;
    },

    verifyToken(token: string): { valid: boolean; userId?: number } {
      if (!token || !token.startsWith('token-')) {
        return { valid: false };
      }

      const parts = token.split('-');
      return {
        valid: true,
        userId: parseInt(parts[1])
      };
    }
  });

  // Add authentication hook
  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = fastify.auth.verifyToken(token);

      if (result.valid) {
        request.user = { id: result.userId };
      }
    }
  });

  fastify.log.info('Auth plugin loaded with secret:', secret);
};

// ==================== CORS PLUGIN ====================

const corsPlugin = async (fastify: any, options: any) => {
  const {
    origin = '*',
    methods = 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders = '*',
    credentials = false
  } = options;

  fastify.addHook('onRequest', async (request: any, reply: any) => {
    reply
      .header('Access-Control-Allow-Origin', origin)
      .header('Access-Control-Allow-Methods', methods)
      .header('Access-Control-Allow-Headers', allowedHeaders);

    if (credentials) {
      reply.header('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight
    if (request.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });

  fastify.log.info('CORS plugin loaded');
};

// ==================== LOGGING PLUGIN ====================

const requestLoggingPlugin = async (fastify: any, options: any) => {
  fastify.addHook('onRequest', async (request: any, reply: any) => {
    request.log.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
      headers: request.headers
    }, 'Incoming request');
  });

  fastify.addHook('onResponse', async (request: any, reply: any) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode
    }, 'Request completed');
  });
};

// ==================== CACHE PLUGIN ====================

const cachePlugin = async (fastify: any, options: any) => {
  const { ttl = 60000 } = options; // Default 60 seconds
  const cache = new Map();

  fastify.decorate('cache', {
    get(key: string) {
      const item = cache.get(key);
      if (!item) return null;

      if (Date.now() > item.expires) {
        cache.delete(key);
        return null;
      }

      return item.value;
    },

    set(key: string, value: any, customTtl?: number) {
      cache.set(key, {
        value,
        expires: Date.now() + (customTtl || ttl)
      });
    },

    delete(key: string) {
      cache.delete(key);
    },

    clear() {
      cache.clear();
    }
  });

  fastify.log.info('Cache plugin loaded');
};

// ==================== REGISTER PLUGINS ====================

app.register(databasePlugin);
app.register(authPlugin, { secret: 'my-secret-key' });
app.register(corsPlugin, {
  origin: '*',
  credentials: true
});
app.register(requestLoggingPlugin);
app.register(cachePlugin, { ttl: 30000 });

// ==================== ROUTES USING PLUGINS ====================

// Database routes
app.get('/items', async (request, reply) => {
  const items = await app.db.query('SELECT * FROM items');
  return { items };
});

app.post('/items', async (request, reply) => {
  const item = await app.db.insert('items', request.body);
  reply.code(201);
  return item;
});

// Auth routes
app.post('/login', async (request, reply) => {
  const { username, password } = request.body;

  // Simulate authentication
  if (username === 'admin' && password === 'password') {
    const token = app.auth.generateToken(1);
    return {
      success: true,
      token,
      user: { id: 1, username }
    };
  }

  reply.code(401);
  return {
    success: false,
    error: 'Invalid credentials'
  };
});

app.get('/me', async (request, reply) => {
  if (!request.user) {
    reply.code(401);
    return { error: 'Not authenticated' };
  }

  return {
    user: request.user,
    authenticated: true
  };
});

// Cache routes
app.get('/cached/:key', async (request, reply) => {
  const { key } = request.params;

  let value = app.cache.get(key);

  if (!value) {
    // Simulate expensive operation
    value = {
      key,
      data: `Generated at ${new Date().toISOString()}`,
      random: Math.random()
    };
    app.cache.set(key, value);
    return { ...value, cached: false };
  }

  return { ...value, cached: true };
});

app.post('/cache/:key', async (request, reply) => {
  const { key } = request.params;
  const { value, ttl } = request.body;

  app.cache.set(key, value, ttl);

  return {
    success: true,
    key,
    expiresIn: ttl || 30000
  };
});

app.delete('/cache/:key', async (request, reply) => {
  const { key } = request.params;
  app.cache.delete(key);

  return { success: true, deleted: key };
});

// Plugin composition example
app.get('/dashboard', async (request, reply) => {
  if (!request.user) {
    reply.code(401);
    return { error: 'Authentication required' };
  }

  // Use multiple plugins
  const cacheKey = `dashboard-${request.user.id}`;
  let data = app.cache.get(cacheKey);

  if (!data) {
    const items = await app.db.query('SELECT * FROM items');
    data = {
      user: request.user,
      items,
      generatedAt: new Date().toISOString()
    };
    app.cache.set(cacheKey, data, 10000); // Cache for 10 seconds
  }

  return {
    ...data,
    cached: !!app.cache.get(cacheKey)
  };
});

// Start server
app.listen({ port: 3003 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`\n🚀 Server ready at ${address}`);
  console.log(`\nPlugin examples:`);
  console.log(`  GET  ${address}/items - Database plugin`);
  console.log(`  POST ${address}/items - Database plugin`);
  console.log(`  POST ${address}/login - Auth plugin`);
  console.log(`       Body: { "username": "admin", "password": "password" }`);
  console.log(`  GET  ${address}/me - Auth plugin (requires token)`);
  console.log(`  GET  ${address}/cached/test - Cache plugin`);
  console.log(`  POST ${address}/cache/mykey - Cache plugin`);
  console.log(`  GET  ${address}/dashboard - Multiple plugins composed\n`);
});
