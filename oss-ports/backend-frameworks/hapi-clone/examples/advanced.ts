/**
 * Advanced Hapi Clone Example
 *
 * Demonstrates plugins, authentication, validation, and advanced features
 */

import Hapi from '../src/hapi.ts';

// ==================== PLUGINS ====================

const loggerPlugin: Hapi.Plugin = {
  name: 'logger',
  version: '1.0.0',
  register: async (server, options) => {
    server.ext('onRequest', async (request, h) => {
      console.log(`[${new Date().toISOString()}] ${request.method.toUpperCase()} ${request.path}`);
      return h.continue;
    });

    server.decorate('server', 'log', (message: string) => {
      console.log(`[LOG] ${message}`);
    });
  }
};

const authPlugin: Hapi.Plugin = {
  name: 'auth',
  version: '1.0.0',
  register: async (server, options) => {
    const users = [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
      { id: 2, username: 'user', password: 'user123', role: 'user' }
    ];

    server.auth.strategy('simple', 'bearer', {
      validate: async (request: any, token: string) => {
        const user = users.find(u => `token-${u.username}` === token);

        if (!user) {
          return { isValid: false };
        }

        return {
          isValid: true,
          credentials: { id: user.id, username: user.username, role: user.role }
        };
      }
    });

    server.decorate('server', 'users', users);
  },
  dependencies: ['logger']
};

const validationPlugin: Hapi.Plugin = {
  name: 'validation',
  version: '1.0.0',
  register: async (server, options) => {
    server.decorate('server', 'validate', (data: any, schema: any) => {
      // Simple validation implementation
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in data)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
      }

      if (schema.properties) {
        for (const [field, props] of Object.entries(schema.properties as any)) {
          if (field in data) {
            const value = data[field];
            if (props.type === 'string' && typeof value !== 'string') {
              throw new Error(`Field ${field} must be a string`);
            }
            if (props.type === 'number' && typeof value !== 'number') {
              throw new Error(`Field ${field} must be a number`);
            }
            if (props.minLength && value.length < props.minLength) {
              throw new Error(`Field ${field} must be at least ${props.minLength} characters`);
            }
          }
        }
      }

      return true;
    });
  }
};

const cachePlugin: Hapi.Plugin = {
  name: 'cache',
  version: '1.0.0',
  register: async (server, options) => {
    const cache = new Map<string, { value: any; expires: number }>();

    server.decorate('server', 'cache', {
      get: (key: string) => {
        const item = cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expires) {
          cache.delete(key);
          return null;
        }

        return item.value;
      },

      set: (key: string, value: any, ttl: number = 60000) => {
        cache.set(key, {
          value,
          expires: Date.now() + ttl
        });
      },

      delete: (key: string) => {
        cache.delete(key);
      },

      clear: () => {
        cache.clear();
      }
    });
  }
};

// ==================== DATABASE SIMULATION ====================

class Database {
  private users = [
    { id: 1, username: 'alice', email: 'alice@example.com', role: 'admin' },
    { id: 2, username: 'bob', email: 'bob@example.com', role: 'user' }
  ];

  private posts = [
    { id: 1, userId: 1, title: 'First Post', content: 'Hello World', published: true },
    { id: 2, userId: 2, title: 'Draft', content: 'Work in progress', published: false }
  ];

  getUsers() {
    return this.users;
  }

  getUser(id: number) {
    return this.users.find(u => u.id === id);
  }

  createUser(data: any) {
    const user = { id: this.users.length + 1, ...data };
    this.users.push(user);
    return user;
  }

  getPosts(published?: boolean) {
    if (published !== undefined) {
      return this.posts.filter(p => p.published === published);
    }
    return this.posts;
  }

  getPost(id: number) {
    return this.posts.find(p => p.id === id);
  }

  createPost(data: any) {
    const post = { id: this.posts.length + 1, ...data };
    this.posts.push(post);
    return post;
  }
}

// ==================== SERVER SETUP ====================

const server = Hapi.server({
  port: 3300,
  host: '0.0.0.0',
  routes: {
    cors: {
      origin: ['*'],
      credentials: true
    }
  }
});

const db = new Database();

// Register plugins
await server.register(loggerPlugin);
await server.register(authPlugin);
await server.register(validationPlugin);
await server.register(cachePlugin);

// ==================== ROUTES ====================

// Public routes
server.route([
  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return {
        name: 'Advanced Hapi Clone API',
        version: '1.0.0',
        endpoints: [
          'GET /',
          'GET /users',
          'GET /users/{id}',
          'POST /users',
          'GET /posts',
          'GET /posts/{id}',
          'POST /posts (requires auth)',
          'GET /admin/stats (requires auth)'
        ]
      };
    }
  },

  {
    method: 'GET',
    path: '/users',
    handler: (request, h) => {
      const users = db.getUsers();
      return { users, count: users.length };
    },
    options: {
      description: 'List all users',
      tags: ['api', 'users']
    }
  },

  {
    method: 'GET',
    path: '/users/{id}',
    handler: (request, h) => {
      const { id } = request.params;
      const user = db.getUser(parseInt(id));

      if (!user) {
        return h.response({ error: 'User not found' }).code(404);
      }

      return { user };
    },
    options: {
      validate: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      },
      description: 'Get user by ID',
      tags: ['api', 'users']
    }
  },

  {
    method: 'POST',
    path: '/users',
    handler: (request, h) => {
      const { username, email, role } = request.payload as any;

      const user = db.createUser({ username, email, role: role || 'user' });

      return h.response({ user }).code(201);
    },
    options: {
      validate: {
        payload: {
          type: 'object',
          required: ['username', 'email'],
          properties: {
            username: { type: 'string', minLength: 3 },
            email: { type: 'string' },
            role: { type: 'string' }
          }
        }
      },
      description: 'Create new user',
      tags: ['api', 'users']
    }
  },

  {
    method: 'GET',
    path: '/posts',
    handler: (request, h) => {
      const { published } = request.query;

      const publishedFilter = published === 'true' ? true :
                             published === 'false' ? false :
                             undefined;

      const posts = db.getPosts(publishedFilter);

      return { posts, count: posts.length };
    },
    options: {
      description: 'List posts',
      tags: ['api', 'posts']
    }
  },

  {
    method: 'GET',
    path: '/posts/{id}',
    handler: (request, h) => {
      const { id } = request.params;

      // Check cache
      const cacheKey = `post:${id}`;
      const cached = (server as any).cache.get(cacheKey);

      if (cached) {
        return { post: cached, cached: true };
      }

      const post = db.getPost(parseInt(id));

      if (!post) {
        return h.response({ error: 'Post not found' }).code(404);
      }

      // Cache for 30 seconds
      (server as any).cache.set(cacheKey, post, 30000);

      return { post, cached: false };
    },
    options: {
      description: 'Get post by ID (cached)',
      tags: ['api', 'posts']
    }
  }
]);

// Protected routes
server.route([
  {
    method: 'POST',
    path: '/posts',
    handler: (request, h) => {
      const { title, content, published } = request.payload as any;
      const userId = request.auth.credentials?.id;

      const post = db.createPost({
        userId,
        title,
        content,
        published: published || false
      });

      return h.response({ post }).code(201);
    },
    options: {
      auth: 'simple',
      validate: {
        payload: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', minLength: 1 },
            content: { type: 'string', minLength: 1 },
            published: { type: 'boolean' }
          }
        }
      },
      description: 'Create new post (requires auth)',
      tags: ['api', 'posts', 'auth']
    }
  },

  {
    method: 'GET',
    path: '/admin/stats',
    handler: (request, h) => {
      const credentials = request.auth.credentials;

      if ((credentials as any)?.role !== 'admin') {
        return h.response({ error: 'Forbidden' }).code(403);
      }

      return {
        users: db.getUsers().length,
        posts: db.getPosts().length,
        publishedPosts: db.getPosts(true).length,
        draftPosts: db.getPosts(false).length,
        timestamp: new Date().toISOString()
      };
    },
    options: {
      auth: 'simple',
      description: 'Admin statistics (requires admin role)',
      tags: ['api', 'admin', 'auth']
    }
  },

  {
    method: 'DELETE',
    path: '/cache',
    handler: (request, h) => {
      (server as any).cache.clear();
      return { success: true, message: 'Cache cleared' };
    },
    options: {
      auth: 'simple',
      description: 'Clear cache (requires auth)',
      tags: ['api', 'cache', 'auth']
    }
  }
]);

// ==================== START SERVER ====================

await server.start();

console.log('\n🚀 Advanced Hapi Clone server started\n');
console.log(`Server running at: ${server.info.uri}`);
console.log('\nPlugins loaded:');
console.log('  ✓ Logger - Request logging');
console.log('  ✓ Auth - Bearer token authentication');
console.log('  ✓ Validation - Request validation');
console.log('  ✓ Cache - Response caching');
console.log('\nPublic endpoints:');
console.log('  GET  /users - List users');
console.log('  GET  /users/{id} - Get user');
console.log('  POST /users - Create user');
console.log('  GET  /posts - List posts');
console.log('  GET  /posts/{id} - Get post (cached)');
console.log('\nProtected endpoints:');
console.log('  POST /posts - Create post');
console.log('  GET  /admin/stats - Admin stats (admin only)');
console.log('  DELETE /cache - Clear cache');
console.log('\nAuthentication:');
console.log('  Use: Authorization: Bearer token-admin');
console.log('  Or:  Authorization: Bearer token-user\n');
