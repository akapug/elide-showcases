/**
 * Middleware (Filters) Example
 *
 * Demonstrates:
 * - Before filters (run before route handlers)
 * - After filters (run after route handlers)
 * - Pattern-specific filters
 * - Error handling
 * - Authentication example
 */

import { Sinatra } from '../server';

class FilterApp extends Sinatra.Base {
  // Class will be configured below
}

// Global before filter - runs for all routes
FilterApp.before(function() {
  console.log(`→ ${this.request.method} ${this.request.path}`);
});

// Global after filter - runs after all routes
FilterApp.after(function() {
  console.log(`← ${this.response.statusCode}`);
});

// Pattern-specific before filter - only for /admin/* routes
FilterApp.before('/admin/*', function() {
  const token = this.request.req.headers['authorization'];

  if (!token || token !== 'Bearer secret-token') {
    this.halt(401, JSON.stringify({
      error: 'Unauthorized',
      message: 'Admin access requires valid token'
    }));
  }

  console.log('  ✓ Admin authentication passed');
});

// Pattern-specific before filter - for API routes
FilterApp.before('/api/*', function() {
  this.contentType('json');
  console.log('  → API request');
});

// Timing filter - measures request duration
FilterApp.before(function() {
  (this as any).startTime = Date.now();
});

FilterApp.after(function() {
  const duration = Date.now() - (this as any).startTime;
  this.headers('X-Response-Time', `${duration}ms`);
  console.log(`  Duration: ${duration}ms`);
});

// Routes

FilterApp.get('/', function() {
  return this.json({
    message: 'Middleware (Filters) Example',
    endpoints: [
      '/',
      '/api/users',
      '/api/posts',
      '/admin/dashboard (requires Authorization: Bearer secret-token)',
      '/admin/settings (requires Authorization: Bearer secret-token)',
      '/error'
    ]
  });
});

FilterApp.get('/api/users', function() {
  return {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Carol' }
    ]
  };
});

FilterApp.get('/api/posts', function() {
  return {
    posts: [
      { id: 1, title: 'First Post', author: 'Alice' },
      { id: 2, title: 'Second Post', author: 'Bob' }
    ]
  };
});

FilterApp.get('/admin/dashboard', function() {
  return this.json({
    message: 'Admin Dashboard',
    stats: {
      users: 150,
      posts: 1240,
      comments: 5678
    }
  });
});

FilterApp.get('/admin/settings', function() {
  return this.json({
    message: 'Admin Settings',
    settings: {
      siteName: 'My Site',
      maintenance: false
    }
  });
});

FilterApp.get('/error', function() {
  throw new Error('Intentional error for testing');
});

// Error handlers

FilterApp.error(404, function(error) {
  return this.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: this.request.path
  });
});

FilterApp.error(401, function(error) {
  return this.json({
    error: 'Unauthorized',
    message: error.message
  });
});

FilterApp.error(500, function(error) {
  return this.json({
    error: 'Internal Server Error',
    message: error.message,
    stack: this.settings.environment === 'development' ? error.stack : undefined
  });
});

// Configuration
FilterApp.configure(function() {
  FilterApp.set('logging', true);
  FilterApp.set('show_exceptions', true);
});

FilterApp.configure('production', function() {
  FilterApp.set('show_exceptions', false);
});

// Start server
FilterApp.run({ port: 4568 });

console.log('✓ Middleware example server running on http://localhost:4568');
console.log('\n  Try these commands:');
console.log('  curl http://localhost:4568/');
console.log('  curl http://localhost:4568/api/users');
console.log('  curl http://localhost:4568/api/posts');
console.log('  curl -H "Authorization: Bearer secret-token" http://localhost:4568/admin/dashboard');
console.log('  curl http://localhost:4568/admin/dashboard (will fail - no auth)');
console.log('  curl http://localhost:4568/error');
console.log('  curl http://localhost:4568/nonexistent');
