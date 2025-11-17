/**
 * Routing Example for Polka Clone
 *
 * Demonstrates advanced routing patterns, parameter handling, and route organization
 */

import polka from '../src/polka.ts';

const app = polka();

// ==================== BASIC ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: 'Polka Routing Demo',
    version: '1.0.0',
    endpoints: {
      basic: [
        'GET /',
        'GET /about',
        'GET /contact'
      ],
      parameters: [
        'GET /users/:id',
        'GET /posts/:slug',
        'GET /categories/:category/posts/:id'
      ],
      queryStrings: [
        'GET /search?q=term',
        'GET /posts?page=1&limit=10'
      ],
      methods: [
        'GET    /items',
        'POST   /items',
        'PUT    /items/:id',
        'DELETE /items/:id'
      ]
    }
  });
});

app.get('/about', (req, res) => {
  res.json({
    name: 'Polka Clone',
    description: 'Fast micro web server',
    author: 'Elide Team'
  });
});

app.get('/contact', (req, res) => {
  res.json({
    email: 'contact@example.com',
    phone: '+1-555-0100'
  });
});

// ==================== ROUTE PARAMETERS ====================

app.get('/users/:id', (req, res) => {
  const { id } = req.params;

  res.json({
    user: {
      id: parseInt(id),
      username: `user${id}`,
      email: `user${id}@example.com`
    }
  });
});

app.get('/posts/:slug', (req, res) => {
  const { slug } = req.params;

  res.json({
    post: {
      slug,
      title: slug.replace(/-/g, ' '),
      content: 'Post content here...'
    }
  });
});

app.get('/categories/:category/posts/:id', (req, res) => {
  const { category, id } = req.params;

  res.json({
    category,
    post: {
      id: parseInt(id),
      categorySlug: category,
      title: `Post ${id} in ${category}`
    }
  });
});

// Nested parameters with query string
app.get('/users/:userId/posts/:postId/comments', (req, res) => {
  const { userId, postId } = req.params;
  const { page = '1', limit = '10' } = req.query;

  res.json({
    userId: parseInt(userId),
    postId: parseInt(postId),
    comments: [
      { id: 1, body: 'Great post!' },
      { id: 2, body: 'Thanks for sharing' }
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// ==================== QUERY STRINGS ====================

app.get('/search', (req, res) => {
  const { q, category, sort = 'relevance' } = req.query;

  if (!q) {
    res.statusCode = 400;
    res.json({
      error: 'Query parameter "q" is required'
    });
    return;
  }

  res.json({
    query: q,
    category: category || 'all',
    sort,
    results: [
      { id: 1, title: 'Result 1', relevance: 0.95 },
      { id: 2, title: 'Result 2', relevance: 0.87 }
    ]
  });
});

app.get('/posts', (req, res) => {
  const {
    page = '1',
    limit = '20',
    status,
    author,
    tag
  } = req.query;

  res.json({
    posts: [
      { id: 1, title: 'Post 1', status: 'published' },
      { id: 2, title: 'Post 2', status: 'draft' }
    ],
    filters: {
      status: status || 'all',
      author: author || 'all',
      tag: tag || 'all'
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 42
    }
  });
});

// ==================== HTTP METHODS ====================

const items: any[] = [
  { id: 1, name: 'Item 1', quantity: 10 },
  { id: 2, name: 'Item 2', quantity: 5 }
];

let nextId = 3;

app.get('/items', (req, res) => {
  res.json({ items });
});

app.post('/items', (req, res) => {
  const item = {
    id: nextId++,
    ...req.body,
    createdAt: new Date().toISOString()
  };

  items.push(item);

  res.statusCode = 201;
  res.json({
    message: 'Item created',
    item
  });
});

app.put('/items/:id', (req, res) => {
  const { id } = req.params;
  const item = items.find(i => i.id === parseInt(id));

  if (!item) {
    res.statusCode = 404;
    res.json({ error: 'Item not found' });
    return;
  }

  Object.assign(item, req.body, {
    updatedAt: new Date().toISOString()
  });

  res.json({
    message: 'Item updated',
    item
  });
});

app.delete('/items/:id', (req, res) => {
  const { id } = req.params;
  const index = items.findIndex(i => i.id === parseInt(id));

  if (index === -1) {
    res.statusCode = 404;
    res.json({ error: 'Item not found' });
    return;
  }

  items.splice(index, 1);

  res.statusCode = 204;
  res.end();
});

// ==================== WILDCARD ROUTES ====================

app.get('/files/*', (req, res) => {
  const filePath = req.path.replace('/files/', '');

  res.json({
    message: 'File route',
    path: filePath,
    fullPath: req.path
  });
});

app.get('/api/v1/*', (req, res) => {
  res.json({
    version: 'v1',
    path: req.path,
    message: 'API v1 endpoint'
  });
});

// ==================== OPTIONAL PARAMETERS ====================

app.get('/products/:category?', (req, res) => {
  const { category } = req.params;

  res.json({
    category: category || 'all',
    products: [
      { id: 1, name: 'Product 1', category: category || 'general' },
      { id: 2, name: 'Product 2', category: category || 'general' }
    ]
  });
});

// ==================== PATTERN MATCHING ====================

// Matches /posts/2024/01/15
app.get('/posts/:year/:month/:day', (req, res) => {
  const { year, month, day } = req.params;

  res.json({
    date: `${year}-${month}-${day}`,
    posts: [
      { id: 1, title: 'Post on this date' }
    ]
  });
});

// Matches /download/file.pdf, /download/image.png, etc.
app.get('/download/:filename', (req, res) => {
  const { filename } = req.params;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json({
    message: 'File download',
    filename
  });
});

// ==================== SUB-ROUTERS ====================

const apiRouter = polka();

apiRouter.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    api: 'v1'
  });
});

// Mount API router
app.use('/api', apiRouter);

// ==================== ROUTE GROUPS ====================

const adminRouter = polka();

adminRouter.get('/dashboard', (req, res) => {
  res.json({
    message: 'Admin dashboard',
    stats: {
      users: 100,
      posts: 500
    }
  });
});

adminRouter.get('/users', (req, res) => {
  res.json({
    users: [
      { id: 1, username: 'admin' },
      { id: 2, username: 'user' }
    ]
  });
});

app.use('/admin', adminRouter);

// ==================== CATCH-ALL / 404 ====================

app.use((req, res) => {
  res.statusCode = 404;
  res.json({
    error: 'Not Found',
    path: req.path,
    message: 'The requested resource was not found'
  });
});

// ==================== START SERVER ====================

app.listen(3700, () => {
  console.log('\n🛣️  Polka Routing Demo listening on port 3700\n');
  console.log('Route Patterns:');
  console.log('  • Basic routes: GET /about');
  console.log('  • Parameters: GET /users/:id');
  console.log('  • Nested params: GET /categories/:cat/posts/:id');
  console.log('  • Query strings: GET /search?q=term');
  console.log('  • Wildcards: GET /files/*');
  console.log('  • Optional params: GET /products/:category?');
  console.log('  • Sub-routers: GET /api/status');
  console.log('  • Route groups: GET /admin/dashboard\n');
  console.log('Examples:');
  console.log('  curl http://localhost:3700/');
  console.log('  curl http://localhost:3700/users/123');
  console.log('  curl http://localhost:3700/categories/tech/posts/456');
  console.log('  curl "http://localhost:3700/search?q=elide&category=frameworks"');
  console.log('  curl http://localhost:3700/posts/2024/01/15');
  console.log('  curl http://localhost:3700/api/status');
  console.log('  curl http://localhost:3700/admin/dashboard\n');
});
