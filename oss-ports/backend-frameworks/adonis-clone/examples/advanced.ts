/**
 * Advanced Adonis Clone Example
 *
 * Demonstrates Lucid ORM, Validators, Auth, Services, and advanced patterns
 */

import { application } from '../src/adonis.ts';

const app = application();

// ==================== CONFIGURATION ====================

app.config.set('app.name', 'Advanced Adonis App');
app.config.set('app.port', 3500);
app.config.set('app.host', '0.0.0.0');
app.config.set('app.key', 'secure-app-key-change-in-production');

// Database configuration
app.config.set('database.connection', 'sqlite');
app.config.set('database.connections.sqlite', {
  client: 'sqlite3',
  connection: {
    filename: ':memory:'
  }
});

// ==================== MODELS (Lucid ORM) ====================

class User {
  static table = 'users';
  static primaryKey = 'id';
  static timestamps = true;

  static columns = new Map([
    ['id', { type: 'integer', nullable: false, unique: true }],
    ['email', { type: 'string', nullable: false, unique: true }],
    ['password', { type: 'string', nullable: false }],
    ['username', { type: 'string', nullable: false, unique: true }],
    ['fullName', { type: 'string', nullable: true }],
    ['avatar', { type: 'string', nullable: true }],
    ['isActive', { type: 'boolean', defaultValue: true }],
    ['role', { type: 'string', defaultValue: 'user' }],
    ['lastLoginAt', { type: 'datetime', nullable: true }],
    ['createdAt', { type: 'datetime', nullable: false }],
    ['updatedAt', { type: 'datetime', nullable: false }]
  ]);

  // Relationships
  static hasMany = ['posts', 'comments'];

  // Computed properties
  get displayName() {
    return this.fullName || this.username;
  }

  // Methods
  async posts() {
    // Return user's posts
    return [];
  }

  async comments() {
    // Return user's comments
    return [];
  }
}

class Post {
  static table = 'posts';
  static primaryKey = 'id';
  static timestamps = true;

  static columns = new Map([
    ['id', { type: 'integer', nullable: false, unique: true }],
    ['userId', { type: 'integer', nullable: false }],
    ['title', { type: 'string', nullable: false }],
    ['slug', { type: 'string', nullable: false, unique: true }],
    ['body', { type: 'text', nullable: false }],
    ['excerpt', { type: 'text', nullable: true }],
    ['featuredImage', { type: 'string', nullable: true }],
    ['status', { type: 'string', defaultValue: 'draft' }],
    ['publishedAt', { type: 'datetime', nullable: true }],
    ['viewCount', { type: 'integer', defaultValue: 0 }],
    ['likeCount', { type: 'integer', defaultValue: 0 }],
    ['commentCount', { type: 'integer', defaultValue: 0 }],
    ['createdAt', { type: 'datetime', nullable: false }],
    ['updatedAt', { type: 'datetime', nullable: false }]
  ]);

  // Relationships
  static belongsTo = ['user'];
  static hasMany = ['comments', 'tags'];

  // Scopes
  static published() {
    return this.where('status', 'published')
               .whereNotNull('publishedAt');
  }

  static draft() {
    return this.where('status', 'draft');
  }

  // Methods
  async user() {
    // Return post author
    return null;
  }

  async comments() {
    // Return post comments
    return [];
  }

  async incrementViews() {
    this.viewCount++;
    await this.save();
  }
}

class Comment {
  static table = 'comments';
  static primaryKey = 'id';
  static timestamps = true;

  static columns = new Map([
    ['id', { type: 'integer', nullable: false, unique: true }],
    ['postId', { type: 'integer', nullable: false }],
    ['userId', { type: 'integer', nullable: false }],
    ['body', { type: 'text', nullable: false }],
    ['isApproved', { type: 'boolean', defaultValue: false }],
    ['createdAt', { type: 'datetime', nullable: false }],
    ['updatedAt', { type: 'datetime', nullable: false }]
  ]);

  // Relationships
  static belongsTo = ['user', 'post'];
}

class Tag {
  static table = 'tags';
  static primaryKey = 'id';

  static columns = new Map([
    ['id', { type: 'integer', nullable: false, unique: true }],
    ['name', { type: 'string', nullable: false, unique: true }],
    ['slug', { type: 'string', nullable: false, unique: true }],
    ['description', { type: 'text', nullable: true }],
    ['createdAt', { type: 'datetime', nullable: false }]
  ]);

  // Relationships
  static belongsToMany = ['posts'];
}

// ==================== VALIDATORS ====================

class CreateUserValidator {
  schema = {
    email: 'required|email|unique:users,email',
    username: 'required|min:3|max:20|unique:users,username',
    password: 'required|min:6',
    fullName: 'string|max:100'
  };

  messages = {
    'email.required': 'Email is required',
    'email.email': 'Please provide a valid email',
    'email.unique': 'Email is already taken',
    'username.required': 'Username is required',
    'username.min': 'Username must be at least 3 characters',
    'username.unique': 'Username is already taken',
    'password.required': 'Password is required',
    'password.min': 'Password must be at least 6 characters'
  };
}

class CreatePostValidator {
  schema = {
    title: 'required|string|min:3|max:200',
    body: 'required|string|min:10',
    excerpt: 'string|max:500',
    status: 'in:draft,published',
    tags: 'array'
  };

  messages = {
    'title.required': 'Title is required',
    'title.min': 'Title must be at least 3 characters',
    'body.required': 'Body is required',
    'body.min': 'Body must be at least 10 characters',
    'status.in': 'Status must be either draft or published'
  };
}

class UpdatePostValidator {
  schema = {
    title: 'string|min:3|max:200',
    body: 'string|min:10',
    excerpt: 'string|max:500',
    status: 'in:draft,published',
    tags: 'array'
  };
}

// ==================== SERVICES ====================

class UserService {
  constructor(private hash: any) {}

  async create(data: any) {
    const hashedPassword = await this.hash.make(data.password);

    return {
      ...data,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
  }

  async authenticate(email: string, password: string) {
    // Find user by email
    const user = null; // Simulate user lookup

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const verified = await this.hash.verify(password, user.password);

    if (!verified) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  async updateLastLogin(userId: number) {
    // Update last login timestamp
    return true;
  }
}

class PostService {
  async create(userId: number, data: any) {
    const slug = this.generateSlug(data.title);

    return {
      userId,
      ...data,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async publish(postId: number) {
    // Update post status to published
    return {
      status: 'published',
      publishedAt: new Date().toISOString()
    };
  }

  async unpublish(postId: number) {
    // Update post status to draft
    return {
      status: 'draft',
      publishedAt: null
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async incrementViews(postId: number) {
    // Increment view count
    return true;
  }

  async addComment(postId: number, commentData: any) {
    // Add comment to post
    return {
      postId,
      ...commentData,
      createdAt: new Date().toISOString()
    };
  }
}

class TagService {
  async findOrCreate(name: string) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    return {
      name,
      slug,
      createdAt: new Date().toISOString()
    };
  }

  async attachToPost(postId: number, tagIds: number[]) {
    // Attach tags to post
    return true;
  }

  async detachFromPost(postId: number, tagIds: number[]) {
    // Detach tags from post
    return true;
  }

  async syncWithPost(postId: number, tagIds: number[]) {
    // Sync tags with post
    return true;
  }
}

// ==================== MIDDLEWARE ====================

class AuthMiddleware {
  async handle(ctx: any, next: any) {
    const authHeader = ctx.request.headers()['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.substring(7);

    // Validate token and get user
    ctx.auth.user = {
      id: 1,
      email: 'user@example.com',
      role: 'user'
    };

    await next();
  }
}

class AdminMiddleware {
  async handle(ctx: any, next: any) {
    if (!ctx.auth.user || ctx.auth.user.role !== 'admin') {
      throw new Error('Forbidden');
    }

    await next();
  }
}

class LoggerMiddleware {
  async handle(ctx: any, next: any) {
    const start = Date.now();

    console.log(`[${new Date().toISOString()}] ${ctx.request.method()} ${ctx.request.url()}`);

    await next();

    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Completed in ${duration}ms`);
  }
}

// ==================== CONTROLLERS ====================

class AuthController {
  constructor(
    private userService: UserService,
    private validator: any
  ) {}

  async register(ctx: any) {
    const validated = await this.validator.validate(
      ctx.request.all(),
      new CreateUserValidator()
    );

    if (!validated.passes) {
      return ctx.response.status(422).json({
        errors: validated.messages
      });
    }

    const user = await this.userService.create(validated.data);

    return ctx.response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  }

  async login(ctx: any) {
    const { email, password } = ctx.request.all();

    try {
      const user = await this.userService.authenticate(email, password);

      await this.userService.updateLastLogin(user.id);

      // Generate token
      const token = `token-${user.id}-${Date.now()}`;

      return ctx.response.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      return ctx.response.status(401).json({
        error: error.message
      });
    }
  }

  async logout(ctx: any) {
    // Invalidate token
    return ctx.response.json({
      message: 'Logged out successfully'
    });
  }

  async me(ctx: any) {
    return ctx.response.json({
      user: ctx.auth.user
    });
  }
}

class PostController {
  constructor(
    private postService: PostService,
    private validator: any
  ) {}

  async index(ctx: any) {
    const {
      page = 1,
      perPage = 20,
      status,
      userId
    } = ctx.request.query;

    // Query posts with filters
    const posts = []; // Simulate database query

    return ctx.response.json({
      data: posts,
      meta: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: 0
      }
    });
  }

  async show(ctx: any) {
    const { id } = ctx.params;

    // Find post by ID
    const post = null; // Simulate database query

    if (!post) {
      return ctx.response.status(404).json({
        error: 'Post not found'
      });
    }

    // Increment views
    await this.postService.incrementViews(parseInt(id));

    return ctx.response.json({ data: post });
  }

  async store(ctx: any) {
    const validated = await this.validator.validate(
      ctx.request.all(),
      new CreatePostValidator()
    );

    if (!validated.passes) {
      return ctx.response.status(422).json({
        errors: validated.messages
      });
    }

    const post = await this.postService.create(
      ctx.auth.user.id,
      validated.data
    );

    return ctx.response.status(201).json({ data: post });
  }

  async update(ctx: any) {
    const { id } = ctx.params;

    const validated = await this.validator.validate(
      ctx.request.all(),
      new UpdatePostValidator()
    );

    if (!validated.passes) {
      return ctx.response.status(422).json({
        errors: validated.messages
      });
    }

    // Update post
    const post = null; // Simulate update

    return ctx.response.json({ data: post });
  }

  async destroy(ctx: any) {
    const { id } = ctx.params;

    // Delete post
    // Also delete related comments, tags, etc.

    return ctx.response.status(204).send();
  }

  async publish(ctx: any) {
    const { id } = ctx.params;

    await this.postService.publish(parseInt(id));

    return ctx.response.json({
      message: 'Post published successfully'
    });
  }

  async unpublish(ctx: any) {
    const { id } = ctx.params;

    await this.postService.unpublish(parseInt(id));

    return ctx.response.json({
      message: 'Post unpublished successfully'
    });
  }
}

// ==================== START APPLICATION ====================

console.log('\n🚀 Starting Advanced Adonis Clone Application\n');
console.log('Features demonstrated:');
console.log('  ✓ Lucid ORM with models and relationships');
console.log('  ✓ Validators with custom rules');
console.log('  ✓ Services for business logic');
console.log('  ✓ Middleware (Auth, Admin, Logger)');
console.log('  ✓ Controllers with dependency injection');
console.log('  ✓ Hash service for passwords');
console.log('  ✓ RESTful routing');
console.log('\nModels:');
console.log('  • User (with posts and comments)');
console.log('  • Post (with user, comments, tags)');
console.log('  • Comment (with user and post)');
console.log('  • Tag (many-to-many with posts)');
console.log('\nAPI Structure:');
console.log('  POST   /auth/register - Register new user');
console.log('  POST   /auth/login - Login user');
console.log('  POST   /auth/logout - Logout user');
console.log('  GET    /auth/me - Get current user');
console.log('  GET    /posts - List posts');
console.log('  GET    /posts/:id - Show post');
console.log('  POST   /posts - Create post');
console.log('  PUT    /posts/:id - Update post');
console.log('  DELETE /posts/:id - Delete post');
console.log('  POST   /posts/:id/publish - Publish post');
console.log('  POST   /posts/:id/unpublish - Unpublish post\n');

await app.start();
