/**
 * Advanced Sails Clone Example
 *
 * Complete application with Models, Controllers, Policies, and Services
 */

import sails from '../src/sails.ts';

// ==================== MODELS ====================

const User = {
  attributes: {
    email: { type: 'string', required: true, unique: true },
    username: { type: 'string', required: true, unique: true },
    password: { type: 'string', required: true },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    role: { type: 'string', defaultsTo: 'user' },
    active: { type: 'boolean', defaultsTo: true },
    lastLogin: { type: 'string' }
  },
  tableName: 'users',
  autoCreatedAt: true,
  autoUpdatedAt: true
};

const Post = {
  attributes: {
    title: { type: 'string', required: true },
    slug: { type: 'string', unique: true },
    content: { type: 'string', required: true },
    excerpt: { type: 'string' },
    userId: { type: 'number', required: true },
    status: { type: 'string', defaultsTo: 'draft' }, // draft, published
    publishedAt: { type: 'string' },
    viewCount: { type: 'number', defaultsTo: 0 },
    tags: { type: 'json', defaultsTo: [] }
  },
  tableName: 'posts'
};

const Comment = {
  attributes: {
    postId: { type: 'number', required: true },
    userId: { type: 'number', required: true },
    content: { type: 'string', required: true },
    approved: { type: 'boolean', defaultsTo: false }
  },
  tableName: 'comments'
};

const Category = {
  attributes: {
    name: { type: 'string', required: true, unique: true },
    slug: { type: 'string', unique: true },
    description: { type: 'string' },
    parentId: { type: 'number' }
  },
  tableName: 'categories'
};

// ==================== CONTROLLERS ====================

const UserController = {
  async profile(req: any, res: any) {
    const userId = req.session.userId;

    if (!userId) {
      return res.forbidden('Not logged in');
    }

    const user = await User.findOne({ id: userId });

    if (!user) {
      return res.notFound();
    }

    return res.ok({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  },

  async updateProfile(req: any, res: any) {
    const userId = req.session.userId;

    if (!userId) {
      return res.forbidden('Not logged in');
    }

    const { firstName, lastName, email } = req.body;

    const updated = await User.update({ id: userId }, {
      firstName,
      lastName,
      email
    });

    if (updated.length === 0) {
      return res.notFound();
    }

    return res.ok(updated[0]);
  },

  async changePassword(req: any, res: any) {
    const userId = req.session.userId;

    if (!userId) {
      return res.forbidden('Not logged in');
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findOne({ id: userId });

    if (!user) {
      return res.notFound();
    }

    // In production, use proper password hashing
    if (user.password !== currentPassword) {
      return res.badRequest('Current password is incorrect');
    }

    await User.update({ id: userId }, { password: newPassword });

    return res.ok({ success: true, message: 'Password updated' });
  }
};

const PostController = {
  async list(req: any, res: any) {
    const { status, userId, tag, limit = 20, offset = 0 } = req.query;

    let query: any = {};

    if (status) query.status = status;
    if (userId) query.userId = parseInt(userId);

    const posts = await Post.find(query);

    let filtered = posts;

    if (tag) {
      filtered = posts.filter((p: any) =>
        p.tags && Array.isArray(p.tags) && p.tags.includes(tag)
      );
    }

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    return res.ok({
      posts: paginated,
      total: filtered.length,
      limit: limitNum,
      offset: offsetNum
    });
  },

  async create(req: any, res: any) {
    const userId = req.session.userId;

    if (!userId) {
      return res.forbidden('Not logged in');
    }

    const { title, content, excerpt, tags, status } = req.body;

    if (!title || !content) {
      return res.badRequest('Title and content are required');
    }

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const post = await Post.create({
      title,
      slug,
      content,
      excerpt,
      userId,
      tags: tags || [],
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date().toISOString() : null
    });

    return res.created(post);
  },

  async update(req: any, res: any) {
    const { id } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.forbidden('Not logged in');
    }

    const post = await Post.findOne({ id: parseInt(id) });

    if (!post) {
      return res.notFound();
    }

    if (post.userId !== userId && req.session.role !== 'admin') {
      return res.forbidden('You can only edit your own posts');
    }

    const { title, content, excerpt, tags, status } = req.body;

    const updates: any = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (excerpt) updates.excerpt = excerpt;
    if (tags) updates.tags = tags;
    if (status) {
      updates.status = status;
      if (status === 'published' && !post.publishedAt) {
        updates.publishedAt = new Date().toISOString();
      }
    }

    const updated = await Post.update({ id: parseInt(id) }, updates);

    return res.ok(updated[0]);
  },

  async delete(req: any, res: any) {
    const { id } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.forbidden('Not logged in');
    }

    const post = await Post.findOne({ id: parseInt(id) });

    if (!post) {
      return res.notFound();
    }

    if (post.userId !== userId && req.session.role !== 'admin') {
      return res.forbidden('You can only delete your own posts');
    }

    await Post.destroy({ id: parseInt(id) });

    return res.ok({ success: true, message: 'Post deleted' });
  },

  async incrementViews(req: any, res: any) {
    const { id } = req.params;

    const post = await Post.findOne({ id: parseInt(id) });

    if (!post) {
      return res.notFound();
    }

    await Post.update({ id: parseInt(id) }, {
      viewCount: post.viewCount + 1
    });

    return res.ok({ viewCount: post.viewCount + 1 });
  }
};

const CommentController = {
  async list(req: any, res: any) {
    const { postId } = req.params;

    const comments = await Comment.find({ postId: parseInt(postId), approved: true });

    return res.ok({ comments });
  },

  async create(req: any, res: any) {
    const { postId } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.forbidden('Not logged in');
    }

    const { content } = req.body;

    if (!content) {
      return res.badRequest('Content is required');
    }

    const comment = await Comment.create({
      postId: parseInt(postId),
      userId,
      content,
      approved: false
    });

    return res.created(comment);
  },

  async approve(req: any, res: any) {
    const { id } = req.params;

    if (req.session.role !== 'admin') {
      return res.forbidden('Admin access required');
    }

    const updated = await Comment.update({ id: parseInt(id) }, { approved: true });

    if (updated.length === 0) {
      return res.notFound();
    }

    return res.ok(updated[0]);
  },

  async delete(req: any, res: any) {
    const { id } = req.params;

    if (req.session.role !== 'admin') {
      return res.forbidden('Admin access required');
    }

    await Comment.destroy({ id: parseInt(id) });

    return res.ok({ success: true });
  }
};

const AuthController = {
  async login(req: any, res: any) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.badRequest('Username and password are required');
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.notFound('User not found');
    }

    // In production, use proper password hashing
    if (user.password !== password) {
      return res.forbidden('Invalid password');
    }

    if (!user.active) {
      return res.forbidden('Account is inactive');
    }

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    // Update last login
    await User.update({ id: user.id }, {
      lastLogin: new Date().toISOString()
    });

    return res.ok({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  },

  async logout(req: any, res: any) {
    req.session = {};
    return res.ok({ success: true, message: 'Logged out' });
  },

  async register(req: any, res: any) {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.badRequest('Username, email, and password are required');
    }

    // Check if user exists
    const existing = await User.find({});
    if (existing.some((u: any) => u.username === username)) {
      return res.badRequest('Username already taken');
    }

    if (existing.some((u: any) => u.email === email)) {
      return res.badRequest('Email already registered');
    }

    const user = await User.create({
      username,
      email,
      password, // In production, hash this!
      firstName,
      lastName,
      role: 'user',
      active: true
    });

    return res.created({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  }
};

// ==================== POLICIES ====================

const isAuthenticated = async (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.forbidden('Authentication required');
  }
  next();
};

const isAdmin = async (req: any, res: any, next: any) => {
  if (req.session.role !== 'admin') {
    return res.forbidden('Admin access required');
  }
  next();
};

// ==================== APPLICATION SETUP ====================

const app = sails({
  port: 3400,
  blueprints: {
    rest: true,
    actions: true,
    shortcuts: false
  }
});

// Register models
app.models.set('User', User);
app.models.set('Post', Post);
app.models.set('Comment', Comment);
app.models.set('Category', Category);

// Register controllers
app.controllers.set('User', UserController);
app.controllers.set('Post', PostController);
app.controllers.set('Comment', CommentController);
app.controllers.set('Auth', AuthController);

// Register policies
app.policies.set('isAuthenticated', isAuthenticated);
app.policies.set('isAdmin', isAdmin);

// Custom routes
app.routes = [
  // Auth routes
  { method: 'POST', path: '/auth/login', target: 'Auth.login' },
  { method: 'POST', path: '/auth/logout', target: 'Auth.logout', policies: ['isAuthenticated'] },
  { method: 'POST', path: '/auth/register', target: 'Auth.register' },

  // User routes
  { method: 'GET', path: '/user/profile', target: 'User.profile', policies: ['isAuthenticated'] },
  { method: 'PUT', path: '/user/profile', target: 'User.updateProfile', policies: ['isAuthenticated'] },
  { method: 'POST', path: '/user/change-password', target: 'User.changePassword', policies: ['isAuthenticated'] },

  // Post routes
  { method: 'GET', path: '/posts', target: 'Post.list' },
  { method: 'POST', path: '/posts', target: 'Post.create', policies: ['isAuthenticated'] },
  { method: 'PUT', path: '/posts/:id', target: 'Post.update', policies: ['isAuthenticated'] },
  { method: 'DELETE', path: '/posts/:id', target: 'Post.delete', policies: ['isAuthenticated'] },
  { method: 'POST', path: '/posts/:id/views', target: 'Post.incrementViews' },

  // Comment routes
  { method: 'GET', path: '/posts/:postId/comments', target: 'Comment.list' },
  { method: 'POST', path: '/posts/:postId/comments', target: 'Comment.create', policies: ['isAuthenticated'] },
  { method: 'POST', path: '/comments/:id/approve', target: 'Comment.approve', policies: ['isAdmin'] },
  { method: 'DELETE', path: '/comments/:id', target: 'Comment.delete', policies: ['isAdmin'] }
];

// Seed data
(async () => {
  // Create admin user
  await User.create({
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    active: true
  });

  // Create regular user
  const user = await User.create({
    username: 'john',
    email: 'john@example.com',
    password: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    active: true
  });

  // Create some posts
  await Post.create({
    title: 'Welcome to the Blog',
    slug: 'welcome-to-the-blog',
    content: 'This is the first post on our blog!',
    excerpt: 'Introduction post',
    userId: user.id,
    status: 'published',
    publishedAt: new Date().toISOString(),
    tags: ['welcome', 'introduction']
  });

  // Start server
  await app.lift();

  console.log('\n🚀 Advanced Sails Clone application started\n');
  console.log('Features:');
  console.log('  ✓ Models (User, Post, Comment, Category)');
  console.log('  ✓ Controllers (CRUD operations)');
  console.log('  ✓ Policies (Authentication, Authorization)');
  console.log('  ✓ Blueprints (Auto REST API)');
  console.log('  ✓ Session management');
  console.log('\nAPI Endpoints:');
  console.log('  POST /auth/register - Register user');
  console.log('  POST /auth/login - Login');
  console.log('  POST /auth/logout - Logout');
  console.log('  GET  /user/profile - Get profile');
  console.log('  PUT  /user/profile - Update profile');
  console.log('  GET  /posts - List posts');
  console.log('  POST /posts - Create post');
  console.log('  GET  /posts/:postId/comments - List comments');
  console.log('\nDefault users:');
  console.log('  admin/admin123 (admin role)');
  console.log('  john/user123 (user role)\n');
})();
