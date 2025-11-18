/**
 * Plugins Example
 *
 * Demonstrates:
 * - Creating custom plugins
 * - Using built-in plugins
 * - Plugin encapsulation
 * - Plugin options
 * - Plugin dependencies
 * - Extending Fastify with decorators
 */

import { fastify, FastifyInstance } from '../src/fastify';
import { PluginFactory, CommonPlugins } from '../src/plugins';

const app = fastify({
  logger: true,
});

// Register CORS plugin
app.register(CommonPlugins.cors({
  origin: '*',
  credentials: true,
}));

// Register Helmet (security headers) plugin
app.register(CommonPlugins.helmet());

// Register rate limiting plugin
app.register(CommonPlugins.rateLimit({
  max: 100,
  windowMs: 60000,
}));

// Register health check plugin
app.register(CommonPlugins.healthCheck({
  path: '/health',
}));

// Register cookie plugin
app.register(CommonPlugins.cookie());

// Register Swagger documentation plugin
app.register(CommonPlugins.swagger({
  info: {
    title: 'Fastify Plugins Example API',
    description: 'Demonstrating Fastify plugin system on Elide',
    version: '1.0.0',
  },
}));

// Custom database plugin
const databasePlugin = PluginFactory.simple('database', async (instance, opts) => {
  // Simulate database connection
  const db = {
    connect: async () => {
      instance.log.info('Database connected');
      return true;
    },
    query: async (sql: string) => {
      instance.log.info(`Executing query: ${sql}`);
      return { rows: [] };
    },
    close: async () => {
      instance.log.info('Database connection closed');
    },
  };

  await db.connect();

  // Decorate instance with database
  instance.decorate('db', db);

  // Close database on server shutdown
  instance.addHook('onResponse', async () => {
    // Cleanup logic could go here
  });
});

app.register(databasePlugin);

// Custom authentication plugin
const authPlugin = PluginFactory.simple('auth', async (instance, opts) => {
  // Decorate request with user
  instance.decorateRequest('user', null);

  // Add authentication helper
  instance.decorate('authenticate', async function(request: any) {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    // Simulate token verification
    const user = { id: 1, name: 'John Doe', token };
    request.user = user;

    return user;
  });
});

app.register(authPlugin);

// Custom metrics plugin
const metricsPlugin = PluginFactory.simple('metrics', async (instance, opts) => {
  const metrics = {
    requests: 0,
    errors: 0,
    responseTime: [] as number[],
  };

  instance.addHook('onRequest', async (request, reply) => {
    metrics.requests++;
    (request as any).startTime = Date.now();
  });

  instance.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - (request as any).startTime;
    metrics.responseTime.push(duration);
  });

  instance.addHook('onError', async (request, reply) => {
    metrics.errors++;
  } as any);

  // Add metrics endpoint
  instance.get('/metrics', async (request, reply) => {
    const avgResponseTime = metrics.responseTime.length > 0
      ? metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length
      : 0;

    return {
      requests: metrics.requests,
      errors: metrics.errors,
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
    };
  });
});

app.register(metricsPlugin);

// Plugin with prefix (API versioning)
const v1Plugin = async (instance: FastifyInstance, opts: any) => {
  instance.get('/users', async (request, reply) => {
    return {
      version: 'v1',
      users: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ],
    };
  });

  instance.get('/posts', async (request, reply) => {
    return {
      version: 'v1',
      posts: [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
      ],
    };
  });
};

app.register(v1Plugin, { prefix: '/v1' });

// Another version with different prefix
const v2Plugin = async (instance: FastifyInstance, opts: any) => {
  instance.get('/users', async (request, reply) => {
    return {
      version: 'v2',
      users: [
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' },
      ],
    };
  });
};

app.register(v2Plugin, { prefix: '/v2' });

// Routes

app.get('/', async (request, reply) => {
  return {
    message: 'Fastify Plugins Example',
    endpoints: {
      '/health': 'Health check',
      '/metrics': 'Application metrics',
      '/documentation': 'API documentation',
      '/v1/users': 'API v1 - Users',
      '/v2/users': 'API v2 - Users (enhanced)',
      '/db-query': 'Database query example',
      '/protected': 'Protected route (requires auth)',
    },
  };
});

// Route using database decorator
app.get('/db-query', async (request, reply) => {
  const db = (app as any).db;

  const result = await db.query('SELECT * FROM users');

  return {
    message: 'Database query executed',
    rows: result.rows.length,
  };
});

// Protected route using auth decorator
app.get('/protected', async (request, reply) => {
  try {
    const user = await (app as any).authenticate(request);

    return {
      message: 'Welcome to protected resource',
      user,
    };
  } catch (error) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: (error as Error).message,
    });
  }
});

// Route using cookie plugin
app.get('/set-cookie', async (request, reply) => {
  (reply as any).setCookie('session', 'abc123', {
    maxAge: 3600,
    httpOnly: true,
    secure: false,
    path: '/',
  });

  return {
    message: 'Cookie set',
    cookie: 'session=abc123',
  };
});

app.get('/read-cookie', async (request, reply) => {
  const cookies = (request as any).cookies;

  return {
    message: 'Cookies read',
    cookies,
  };
});

// Start server
const start = async () => {
  try {
    await app.ready(); // Wait for all plugins to load

    const address = await app.listen(3003);
    console.log(`Plugins example server listening on ${address}`);
    console.log('\nPlugins loaded successfully!');
    console.log('\nTry these URLs:');
    console.log('\n📊 Metrics:');
    console.log('  curl http://localhost:3003/metrics');
    console.log('\n💚 Health check:');
    console.log('  curl http://localhost:3003/health');
    console.log('\n📚 API Documentation:');
    console.log('  curl http://localhost:3003/documentation');
    console.log('\n🔢 API Versions:');
    console.log('  curl http://localhost:3003/v1/users');
    console.log('  curl http://localhost:3003/v2/users');
    console.log('\n💾 Database query:');
    console.log('  curl http://localhost:3003/db-query');
    console.log('\n🔒 Protected route:');
    console.log('  curl http://localhost:3003/protected -H "Authorization: Bearer my-token"');
    console.log('\n🍪 Cookies:');
    console.log('  curl http://localhost:3003/set-cookie -c cookies.txt');
    console.log('  curl http://localhost:3003/read-cookie -b cookies.txt');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
