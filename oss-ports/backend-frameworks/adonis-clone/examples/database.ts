/**
 * Database & Lucid ORM Example for Adonis Clone
 *
 * Demonstrates database operations, query builder, relationships, and migrations
 */

import { application } from '../src/adonis.ts';

const app = application();

// ==================== CONFIGURATION ====================

app.config.set('app.name', 'Adonis Database Demo');
app.config.set('app.port', 3500);

app.config.set('database.connection', 'sqlite');
app.config.set('database.connections.sqlite', {
  client: 'sqlite3',
  connection: {
    filename: ':memory:'
  },
  useNullAsDefault: true
});

// ==================== DATABASE CLIENT ====================

class Database {
  private tables: Map<string, any[]>;

  constructor() {
    this.tables = new Map();
    this.initializeTables();
  }

  private initializeTables() {
    // Users table
    this.tables.set('users', [
      {
        id: 1,
        email: 'alice@example.com',
        username: 'alice',
        fullName: 'Alice Johnson',
        role: 'admin',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        email: 'bob@example.com',
        username: 'bob',
        fullName: 'Bob Smith',
        role: 'user',
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ]);

    // Posts table
    this.tables.set('posts', [
      {
        id: 1,
        userId: 1,
        title: 'Getting Started with Adonis',
        slug: 'getting-started-with-adonis',
        body: 'Adonis is a powerful framework...',
        status: 'published',
        publishedAt: '2024-01-01T10:00:00Z',
        viewCount: 150,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 2,
        userId: 2,
        title: 'Building APIs with Adonis',
        slug: 'building-apis-with-adonis',
        body: 'Learn how to build RESTful APIs...',
        status: 'draft',
        publishedAt: null,
        viewCount: 0,
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-02T10:00:00Z'
      }
    ]);

    // Comments table
    this.tables.set('comments', [
      {
        id: 1,
        postId: 1,
        userId: 2,
        body: 'Great article!',
        isApproved: true,
        createdAt: '2024-01-01T11:00:00Z',
        updatedAt: '2024-01-01T11:00:00Z'
      }
    ]);

    // Tags table
    this.tables.set('tags', [
      { id: 1, name: 'JavaScript', slug: 'javascript' },
      { id: 2, name: 'TypeScript', slug: 'typescript' },
      { id: 3, name: 'Elide', slug: 'elide' }
    ]);

    // Post-Tag pivot table
    this.tables.set('post_tag', [
      { postId: 1, tagId: 1 },
      { postId: 1, tagId: 3 }
    ]);
  }

  table(name: string) {
    return new QueryBuilder(this, name);
  }

  insert(table: string, data: any) {
    const records = this.tables.get(table) || [];
    const id = records.length > 0 ? Math.max(...records.map((r: any) => r.id)) + 1 : 1;

    const record = { id, ...data };
    records.push(record);
    this.tables.set(table, records);

    return record;
  }

  update(table: string, id: number, updates: any) {
    const records = this.tables.get(table) || [];
    const record = records.find((r: any) => r.id === id);

    if (record) {
      Object.assign(record, updates);
    }

    return record;
  }

  delete(table: string, id: number) {
    const records = this.tables.get(table) || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index !== -1) {
      records.splice(index, 1);
      return true;
    }

    return false;
  }
}

class QueryBuilder {
  private db: Database;
  private tableName: string;
  private whereConditions: any[] = [];
  private selectColumns: string[] = [];
  private orderByField: string | null = null;
  private orderByDirection: 'asc' | 'desc' = 'asc';
  private limitValue: number | null = null;
  private offsetValue: number = 0;

  constructor(db: Database, table: string) {
    this.db = db;
    this.tableName = table;
  }

  select(...columns: string[]) {
    this.selectColumns = columns;
    return this;
  }

  where(field: string, operator: any, value?: any) {
    if (value === undefined) {
      value = operator;
      operator = '=';
    }

    this.whereConditions.push({ field, operator, value });
    return this;
  }

  whereIn(field: string, values: any[]) {
    this.whereConditions.push({ field, operator: 'in', value: values });
    return this;
  }

  whereBetween(field: string, range: [any, any]) {
    this.whereConditions.push({ field, operator: 'between', value: range });
    return this;
  }

  whereNull(field: string) {
    this.whereConditions.push({ field, operator: 'null' });
    return this;
  }

  whereNotNull(field: string) {
    this.whereConditions.push({ field, operator: 'not null' });
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    this.orderByField = field;
    this.orderByDirection = direction;
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  offset(count: number) {
    this.offsetValue = count;
    return this;
  }

  get(): any[] {
    const table = (this.db as any).tables.get(this.tableName) || [];
    let results = [...table];

    // Apply where conditions
    results = results.filter(record => {
      return this.whereConditions.every(condition => {
        const fieldValue = record[condition.field];

        switch (condition.operator) {
          case '=':
            return fieldValue === condition.value;
          case '!=':
            return fieldValue !== condition.value;
          case '>':
            return fieldValue > condition.value;
          case '>=':
            return fieldValue >= condition.value;
          case '<':
            return fieldValue < condition.value;
          case '<=':
            return fieldValue <= condition.value;
          case 'in':
            return condition.value.includes(fieldValue);
          case 'between':
            return fieldValue >= condition.value[0] && fieldValue <= condition.value[1];
          case 'null':
            return fieldValue === null;
          case 'not null':
            return fieldValue !== null;
          default:
            return true;
        }
      });
    });

    // Apply ordering
    if (this.orderByField) {
      results.sort((a, b) => {
        const aVal = a[this.orderByField!];
        const bVal = b[this.orderByField!];

        if (this.orderByDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Apply offset and limit
    if (this.offsetValue > 0) {
      results = results.slice(this.offsetValue);
    }

    if (this.limitValue !== null) {
      results = results.slice(0, this.limitValue);
    }

    // Apply column selection
    if (this.selectColumns.length > 0) {
      results = results.map(record => {
        const selected: any = {};
        for (const col of this.selectColumns) {
          selected[col] = record[col];
        }
        return selected;
      });
    }

    return results;
  }

  first(): any | null {
    const results = this.limit(1).get();
    return results.length > 0 ? results[0] : null;
  }

  count(): number {
    return this.get().length;
  }

  async paginate(page: number = 1, perPage: number = 20) {
    this.offset((page - 1) * perPage).limit(perPage);

    const data = this.get();
    const total = this.count();

    return {
      data,
      meta: {
        total,
        perPage,
        currentPage: page,
        lastPage: Math.ceil(total / perPage),
        from: (page - 1) * perPage + 1,
        to: Math.min(page * perPage, total)
      }
    };
  }
}

const db = new Database();

// ==================== MODELS ====================

class User {
  static table = 'users';

  static all() {
    return db.table(this.table).get();
  }

  static find(id: number) {
    return db.table(this.table).where('id', id).first();
  }

  static findBy(field: string, value: any) {
    return db.table(this.table).where(field, value).first();
  }

  static create(data: any) {
    return db.insert(this.table, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static update(id: number, data: any) {
    return db.update(this.table, id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  static delete(id: number) {
    return db.delete(this.table, id);
  }

  static active() {
    return db.table(this.table).where('isActive', true);
  }

  static admins() {
    return db.table(this.table).where('role', 'admin');
  }
}

class Post {
  static table = 'posts';

  static all() {
    return db.table(this.table).get();
  }

  static find(id: number) {
    return db.table(this.table).where('id', id).first();
  }

  static create(data: any) {
    return db.insert(this.table, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static published() {
    return db.table(this.table).where('status', 'published').whereNotNull('publishedAt');
  }

  static byUser(userId: number) {
    return db.table(this.table).where('userId', userId);
  }

  static popular() {
    return db.table(this.table).orderBy('viewCount', 'desc');
  }
}

// ==================== CONTROLLERS ====================

class UserController {
  async index(ctx: any) {
    const users = User.all();

    return ctx.response.json({
      users
    });
  }

  async show(ctx: any) {
    const id = parseInt(ctx.params.id);
    const user = User.find(id);

    if (!user) {
      return ctx.response.status(404).json({
        error: 'User not found'
      });
    }

    return ctx.response.json({ user });
  }

  async store(ctx: any) {
    const data = ctx.request.body;

    const user = User.create(data);

    return ctx.response.status(201).json({
      message: 'User created successfully',
      user
    });
  }

  async update(ctx: any) {
    const id = parseInt(ctx.params.id);
    const data = ctx.request.body;

    const user = User.update(id, data);

    if (!user) {
      return ctx.response.status(404).json({
        error: 'User not found'
      });
    }

    return ctx.response.json({
      message: 'User updated successfully',
      user
    });
  }

  async destroy(ctx: any) {
    const id = parseInt(ctx.params.id);

    const deleted = User.delete(id);

    if (!deleted) {
      return ctx.response.status(404).json({
        error: 'User not found'
      });
    }

    return ctx.response.status(204).send();
  }
}

class PostController {
  async index(ctx: any) {
    const { status, userId, page = 1, perPage = 20 } = ctx.request.query;

    let query = db.table('posts');

    if (status) {
      query = query.where('status', status);
    }

    if (userId) {
      query = query.where('userId', parseInt(userId));
    }

    const result = await query.orderBy('createdAt', 'desc').paginate(page, perPage);

    return ctx.response.json(result);
  }

  async show(ctx: any) {
    const id = parseInt(ctx.params.id);
    const post = Post.find(id);

    if (!post) {
      return ctx.response.status(404).json({
        error: 'Post not found'
      });
    }

    // Increment view count
    Post.update(id, { viewCount: post.viewCount + 1 });

    return ctx.response.json({ post });
  }

  async published(ctx: any) {
    const posts = Post.published().orderBy('publishedAt', 'desc').get();

    return ctx.response.json({ posts });
  }

  async popular(ctx: any) {
    const posts = Post.popular().limit(10).get();

    return ctx.response.json({ posts });
  }
}

class QueryController {
  async rawQuery(ctx: any) {
    // Example: Complex query with joins
    const users = User.all();
    const posts = Post.all();

    const usersWithPosts = users.map(user => ({
      ...user,
      posts: posts.filter((p: any) => p.userId === user.id),
      postCount: posts.filter((p: any) => p.userId === user.id).length
    }));

    return ctx.response.json({
      users: usersWithPosts
    });
  }

  async aggregation(ctx: any) {
    const posts = Post.all();

    const stats = {
      totalPosts: posts.length,
      publishedPosts: posts.filter((p: any) => p.status === 'published').length,
      draftPosts: posts.filter((p: any) => p.status === 'draft').length,
      totalViews: posts.reduce((sum: number, p: any) => sum + p.viewCount, 0),
      avgViews: posts.reduce((sum: number, p: any) => sum + p.viewCount, 0) / posts.length
    };

    return ctx.response.json({ stats });
  }
}

// ==================== START APPLICATION ====================

console.log('\n📊 Adonis Database & Lucid ORM Demo\n');
console.log('Features:');
console.log('  • Query Builder with fluent API');
console.log('  • Model-based database interactions');
console.log('  • Where clauses and filters');
console.log('  • Ordering and pagination');
console.log('  • Relationships (simulated)');
console.log('  • Aggregations and stats\n');
console.log('Models:');
console.log('  • User - User management');
console.log('  • Post - Blog posts');
console.log('  • Comment - Post comments');
console.log('  • Tag - Post tags\n');
console.log('Endpoints:\n');
console.log('Users:');
console.log('  GET    /users - List all users');
console.log('  GET    /users/:id - Get user by ID');
console.log('  POST   /users - Create user');
console.log('  PUT    /users/:id - Update user');
console.log('  DELETE /users/:id - Delete user\n');
console.log('Posts:');
console.log('  GET    /posts - List posts (with pagination)');
console.log('  GET    /posts/:id - Get post by ID');
console.log('  GET    /posts/published - Published posts only');
console.log('  GET    /posts/popular - Popular posts (by views)\n');
console.log('Queries:');
console.log('  GET    /queries/users-with-posts - Users with post counts');
console.log('  GET    /queries/stats - Post statistics\n');
console.log('Query Examples:');
console.log('  # List users');
console.log('  curl http://localhost:3500/users');
console.log('');
console.log('  # Get published posts');
console.log('  curl http://localhost:3500/posts/published');
console.log('');
console.log('  # Get posts with pagination');
console.log('  curl "http://localhost:3500/posts?page=1&perPage=10"');
console.log('');
console.log('  # Get stats');
console.log('  curl http://localhost:3500/queries/stats\n');

await app.start();
