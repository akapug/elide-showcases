/**
 * API Versioning Example for Restify Clone
 *
 * Demonstrates route versioning, content negotiation, and API evolution
 */

import restify from '../src/restify.ts';

const server = restify.createServer({
  name: 'versioned-api',
  versions: ['1.0.0', '2.0.0', '3.0.0']
});

// ==================== VERSION 1.0.0 ====================

server.get({
  path: '/users/:id',
  version: '1.0.0'
}, (req, res, next) => {
  const { id } = req.params;

  res.send({
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`
  });
});

server.get({
  path: '/posts',
  version: '1.0.0'
}, (req, res, next) => {
  res.send({
    posts: [
      { id: 1, title: 'Post 1', author: 'Alice' },
      { id: 2, title: 'Post 2', author: 'Bob' }
    ]
  });
});

// ==================== VERSION 2.0.0 ====================
// Added timestamps and more fields

server.get({
  path: '/users/:id',
  version: '2.0.0'
}, (req, res, next) => {
  const { id } = req.params;

  res.send({
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    status: 'active'
  });
});

server.get({
  path: '/posts',
  version: '2.0.0'
}, (req, res, next) => {
  res.send({
    data: [
      {
        id: 1,
        title: 'Post 1',
        author: { id: 1, name: 'Alice' },
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        title: 'Post 2',
        author: { id: 2, name: 'Bob' },
        createdAt: '2024-01-02T00:00:00Z'
      }
    ],
    meta: {
      total: 2,
      version: '2.0.0'
    }
  });
});

// ==================== VERSION 3.0.0 ====================
// Complete redesign with pagination and filtering

server.get({
  path: '/users/:id',
  version: '3.0.0'
}, (req, res, next) => {
  const { id } = req.params;

  res.send({
    user: {
      id,
      profile: {
        username: `user${id}`,
        displayName: `User ${id}`,
        email: `user${id}@example.com`,
        avatar: `https://avatar.example.com/${id}.png`
      },
      settings: {
        emailNotifications: true,
        theme: 'dark'
      },
      metadata: {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        lastLoginAt: '2024-01-20T08:30:00Z',
        status: 'active'
      }
    }
  });
});

server.get({
  path: '/posts',
  version: '3.0.0'
}, (req, res, next) => {
  const { page = '1', limit = '10', status, authorId } = req.query;

  res.send({
    data: [
      {
        id: 1,
        title: 'Advanced Post 1',
        slug: 'advanced-post-1',
        excerpt: 'This is an excerpt',
        content: 'Full content here',
        author: {
          id: 1,
          username: 'alice',
          displayName: 'Alice',
          avatar: 'https://avatar.example.com/1.png'
        },
        metadata: {
          status: 'published',
          publishedAt: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          viewCount: 150,
          likeCount: 25,
          commentCount: 10
        },
        tags: ['technology', 'elide']
      }
    ],
    pagination: {
      currentPage: parseInt(page),
      perPage: parseInt(limit),
      total: 1,
      totalPages: 1,
      hasMore: false
    },
    meta: {
      version: '3.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

// ==================== CROSS-VERSION ROUTES ====================

server.get('/health', (req, res, next) => {
  res.send({
    status: 'healthy',
    version: req.headers['accept-version'] || 'unversioned',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

server.get('/versions', (req, res, next) => {
  res.send({
    supported: ['1.0.0', '2.0.0', '3.0.0'],
    default: '3.0.0',
    deprecated: ['1.0.0'],
    sunset: {
      '1.0.0': '2025-01-01T00:00:00Z'
    },
    changelog: {
      '3.0.0': {
        released: '2024-03-01',
        changes: [
          'Redesigned user response structure',
          'Added pagination to posts endpoint',
          'Enhanced metadata fields'
        ]
      },
      '2.0.0': {
        released: '2024-02-01',
        changes: [
          'Added timestamps',
          'Enhanced author information',
          'Added status field'
        ]
      },
      '1.0.0': {
        released: '2024-01-01',
        changes: ['Initial release']
      }
    }
  });
});

// ==================== MIDDLEWARE ====================

server.use((req, res, next) => {
  const requestedVersion = req.headers['accept-version'] || '3.0.0';

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} (v${requestedVersion})`);

  // Log deprecated version usage
  if (requestedVersion === '1.0.0') {
    console.warn(`⚠️  Deprecated API version ${requestedVersion} used - sunsets 2025-01-01`);
  }

  next();
});

// ==================== START SERVER ====================

server.listen(3600, 'localhost', () => {
  console.log('\n🚀 Versioned Restify API Server\n');
  console.log(`Server listening at http://localhost:3600\n`);
  console.log('API Versions:');
  console.log('  • v1.0.0 - Initial release (DEPRECATED)');
  console.log('  • v2.0.0 - Enhanced with timestamps');
  console.log('  • v3.0.0 - Complete redesign (LATEST)\n');
  console.log('Usage:');
  console.log('  # Request specific version via header');
  console.log('  curl -H "Accept-Version: 1.0.0" http://localhost:3600/users/1');
  console.log('  curl -H "Accept-Version: 2.0.0" http://localhost:3600/users/1');
  console.log('  curl -H "Accept-Version: 3.0.0" http://localhost:3600/users/1\n');
  console.log('  # Or via path (if supported)');
  console.log('  curl http://localhost:3600/v1/users/1');
  console.log('  curl http://localhost:3600/v2/users/1');
  console.log('  curl http://localhost:3600/v3/users/1\n');
  console.log('Endpoints:');
  console.log('  GET /users/:id - Get user (versioned)');
  console.log('  GET /posts - List posts (versioned)');
  console.log('  GET /health - Health check (unversioned)');
  console.log('  GET /versions - API version info\n');
  console.log('Features:');
  console.log('  ✓ Multiple API versions running concurrently');
  console.log('  ✓ Header-based version selection');
  console.log('  ✓ Version deprecation notices');
  console.log('  ✓ Sunset dates for old versions');
  console.log('  ✓ Changelog tracking\n');
});
