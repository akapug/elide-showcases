/**
 * REST API Example for Oak Clone
 *
 * Complete RESTful API with CRUD operations, validation, and error handling
 */

import { Application, Router, Context } from '../src/oak.ts';

const app = new Application();
const router = new Router();

// ==================== IN-MEMORY DATABASE ====================

interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: string;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

const users: User[] = [
  {
    id: 1,
    email: 'alice@example.com',
    username: 'alice',
    fullName: 'Alice Johnson',
    role: 'admin',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'bob@example.com',
    username: 'bob',
    fullName: 'Bob Smith',
    role: 'user',
    active: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
];

const posts: Post[] = [
  {
    id: 1,
    userId: 1,
    title: 'Getting Started with Oak',
    slug: 'getting-started-with-oak',
    content: 'Oak is a middleware framework for Deno...',
    excerpt: 'Introduction to Oak framework',
    status: 'published',
    publishedAt: '2024-01-01T10:00:00Z',
    viewCount: 150,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    userId: 2,
    title: 'Advanced Oak Patterns',
    slug: 'advanced-oak-patterns',
    content: 'Learn advanced patterns in Oak...',
    excerpt: 'Advanced Oak techniques',
    status: 'draft',
    publishedAt: null,
    viewCount: 0,
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-02T10:00:00Z'
  }
];

let nextUserId = 3;
let nextPostId = 3;

// ==================== HELPERS ====================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// ==================== MIDDLEWARE ====================

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status || 200} (${duration}ms)`);
});

// Error handler middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as Error;
    console.error('Error:', error);

    ctx.response.status = (error as any).status || 500;
    ctx.response.body = {
      error: true,
      message: error.message,
      status: ctx.response.status
    };
  }
});

// ==================== USER ROUTES ====================

router.get('/users', (ctx) => {
  const url = ctx.request.url;
  const role = url.searchParams.get('role');
  const active = url.searchParams.get('active');

  let filtered = users;

  if (role) {
    filtered = filtered.filter(u => u.role === role);
  }

  if (active !== null) {
    const isActive = active === 'true';
    filtered = filtered.filter(u => u.active === isActive);
  }

  ctx.response.body = {
    users: filtered.map(({ id, email, username, fullName, role, active }) => ({
      id, email, username, fullName, role, active
    })),
    count: filtered.length
  };
});

router.get('/users/:id', (ctx: any) => {
  const id = parseInt(ctx.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    ctx.response.status = 404;
    ctx.response.body = { error: 'User not found' };
    return;
  }

  const { id: userId, email, username, fullName, role, active, createdAt, updatedAt } = user;
  ctx.response.body = {
    user: { id: userId, email, username, fullName, role, active, createdAt, updatedAt }
  };
});

router.post('/users', async (ctx) => {
  const body = await ctx.request.body();
  const { email, username, fullName, role = 'user' } = body.value;

  // Validation
  if (!email || !validateEmail(email)) {
    ctx.response.status = 400;
    ctx.response.body = { error: 'Valid email is required' };
    return;
  }

  if (!username || !validateUsername(username)) {
    ctx.response.status = 400;
    ctx.response.body = { error: 'Valid username is required (3-20 alphanumeric characters)' };
    return;
  }

  // Check uniqueness
  if (users.some(u => u.email === email)) {
    ctx.response.status = 409;
    ctx.response.body = { error: 'Email already exists' };
    return;
  }

  if (users.some(u => u.username === username)) {
    ctx.response.status = 409;
    ctx.response.body = { error: 'Username already exists' };
    return;
  }

  const newUser: User = {
    id: nextUserId++,
    email,
    username,
    fullName: fullName || '',
    role,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(newUser);

  ctx.response.status = 201;
  ctx.response.body = { user: newUser };
});

router.put('/users/:id', async (ctx: any) => {
  const id = parseInt(ctx.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    ctx.response.status = 404;
    ctx.response.body = { error: 'User not found' };
    return;
  }

  const body = await ctx.request.body();
  const { email, username, fullName, role, active } = body.value;

  // Update fields
  if (email && email !== user.email) {
    if (!validateEmail(email)) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Valid email is required' };
      return;
    }
    if (users.some(u => u.email === email && u.id !== id)) {
      ctx.response.status = 409;
      ctx.response.body = { error: 'Email already exists' };
      return;
    }
    user.email = email;
  }

  if (username && username !== user.username) {
    if (!validateUsername(username)) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Valid username is required' };
      return;
    }
    if (users.some(u => u.username === username && u.id !== id)) {
      ctx.response.status = 409;
      ctx.response.body = { error: 'Username already exists' };
      return;
    }
    user.username = username;
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;

  user.updatedAt = new Date().toISOString();

  ctx.response.body = { user };
});

router.delete('/users/:id', (ctx: any) => {
  const id = parseInt(ctx.params.id);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    ctx.response.status = 404;
    ctx.response.body = { error: 'User not found' };
    return;
  }

  users.splice(index, 1);

  ctx.response.status = 204;
});

// ==================== POST ROUTES ====================

router.get('/posts', (ctx) => {
  const url = ctx.request.url;
  const status = url.searchParams.get('status');
  const userId = url.searchParams.get('userId');

  let filtered = posts;

  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }

  if (userId) {
    filtered = filtered.filter(p => p.userId === parseInt(userId));
  }

  ctx.response.body = {
    posts: filtered,
    count: filtered.length
  };
});

router.get('/posts/:id', (ctx: any) => {
  const id = parseInt(ctx.params.id);
  const post = posts.find(p => p.id === id);

  if (!post) {
    ctx.response.status = 404;
    ctx.response.body = { error: 'Post not found' };
    return;
  }

  // Increment view count
  post.viewCount++;

  ctx.response.body = { post };
});

router.post('/posts', async (ctx) => {
  const body = await ctx.request.body();
  const { userId, title, content, excerpt, status = 'draft' } = body.value;

  // Validation
  if (!userId || !title || !content) {
    ctx.response.status = 400;
    ctx.response.body = { error: 'userId, title, and content are required' };
    return;
  }

  // Check user exists
  if (!users.find(u => u.id === userId)) {
    ctx.response.status = 400;
    ctx.response.body = { error: 'Invalid userId' };
    return;
  }

  const slug = slugify(title);

  // Check slug uniqueness
  if (posts.some(p => p.slug === slug)) {
    ctx.response.status = 409;
    ctx.response.body = { error: 'A post with this title already exists' };
    return;
  }

  const newPost: Post = {
    id: nextPostId++,
    userId,
    title,
    slug,
    content,
    excerpt: excerpt || content.substring(0, 100),
    status,
    publishedAt: status === 'published' ? new Date().toISOString() : null,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  posts.push(newPost);

  ctx.response.status = 201;
  ctx.response.body = { post: newPost };
});

router.put('/posts/:id', async (ctx: any) => {
  const id = parseInt(ctx.params.id);
  const post = posts.find(p => p.id === id);

  if (!post) {
    ctx.response.status = 404;
    ctx.response.body = { error: 'Post not found' };
    return;
  }

  const body = await ctx.request.body();
  const { title, content, excerpt, status } = body.value;

  if (title) {
    const newSlug = slugify(title);
    if (newSlug !== post.slug && posts.some(p => p.slug === newSlug)) {
      ctx.response.status = 409;
      ctx.response.body = { error: 'A post with this title already exists' };
      return;
    }
    post.title = title;
    post.slug = newSlug;
  }

  if (content !== undefined) post.content = content;
  if (excerpt !== undefined) post.excerpt = excerpt;

  if (status && status !== post.status) {
    post.status = status;
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date().toISOString();
    }
  }

  post.updatedAt = new Date().toISOString();

  ctx.response.body = { post };
});

router.delete('/posts/:id', (ctx: any) => {
  const id = parseInt(ctx.params.id);
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) {
    ctx.response.status = 404;
    ctx.response.body = { error: 'Post not found' };
    return;
  }

  posts.splice(index, 1);

  ctx.response.status = 204;
});

// ==================== STATS ROUTE ====================

router.get('/stats', (ctx) => {
  ctx.response.body = {
    users: {
      total: users.length,
      active: users.filter(u => u.active).length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        user: users.filter(u => u.role === 'user').length
      }
    },
    posts: {
      total: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      draft: posts.filter(p => p.status === 'draft').length,
      totalViews: posts.reduce((sum, p) => sum + p.viewCount, 0)
    },
    timestamp: new Date().toISOString()
  };
});

// ==================== ROOT ROUTE ====================

router.get('/', (ctx) => {
  ctx.response.body = {
    name: 'Oak REST API',
    version: '1.0.0',
    endpoints: {
      users: [
        'GET /users - List users',
        'GET /users/:id - Get user',
        'POST /users - Create user',
        'PUT /users/:id - Update user',
        'DELETE /users/:id - Delete user'
      ],
      posts: [
        'GET /posts - List posts',
        'GET /posts/:id - Get post',
        'POST /posts - Create post',
        'PUT /posts/:id - Update post',
        'DELETE /posts/:id - Delete post'
      ],
      other: [
        'GET /stats - API statistics'
      ]
    }
  };
});

// ==================== APPLY ROUTES ====================

app.use(router.routes());
app.use(router.allowedMethods());

// ==================== START SERVER ====================

await app.listen({ port: 3800 });

console.log('\n🚀 Oak REST API listening on port 3800\n');
console.log('Endpoints:');
console.log('  GET    /users - List users');
console.log('  GET    /users/:id - Get user');
console.log('  POST   /users - Create user');
console.log('  PUT    /users/:id - Update user');
console.log('  DELETE /users/:id - Delete user');
console.log('  GET    /posts - List posts');
console.log('  GET    /posts/:id - Get post');
console.log('  POST   /posts - Create post');
console.log('  PUT    /posts/:id - Update post');
console.log('  DELETE /posts/:id - Delete post');
console.log('  GET    /stats - API statistics\n');
