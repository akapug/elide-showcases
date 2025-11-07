/**
 * CMS Platform - API Server
 *
 * Main API server for the CMS platform.
 * Handles routing, authentication, and request processing.
 */

import { createHash, randomBytes } from 'crypto';

interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'author';
  createdAt: Date;
  lastLogin: Date;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

interface Route {
  method: string;
  path: RegExp;
  handler: RouteHandler;
  middleware?: Middleware[];
}

type RouteHandler = (req: Request, res: Response) => Promise<void> | void;
type Middleware = (req: Request, res: Response, next: () => void) => Promise<void> | void;

interface Request {
  method: string;
  url: string;
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  headers: Map<string, string>;
  body?: any;
  user?: User;
  session?: Session;
}

interface Response {
  statusCode: number;
  headers: Map<string, string>;
  body: any;
  status(code: number): Response;
  json(data: any): Response;
  send(data: any): Response;
  setHeader(name: string, value: string): Response;
}

/**
 * API Server
 */
export class ApiServer {
  private routes: Route[] = [];
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.setupRoutes();
    this.initializeDefaultUsers();
  }

  /**
   * Initialize default users
   */
  private initializeDefaultUsers(): void {
    const adminUser: User = {
      id: this.generateId(),
      username: 'admin',
      email: 'admin@cms.local',
      passwordHash: this.hashPassword('admin123'),
      role: 'admin',
      createdAt: new Date(),
      lastLogin: new Date()
    };

    const editorUser: User = {
      id: this.generateId(),
      username: 'editor',
      email: 'editor@cms.local',
      passwordHash: this.hashPassword('editor123'),
      role: 'editor',
      createdAt: new Date(),
      lastLogin: new Date()
    };

    const authorUser: User = {
      id: this.generateId(),
      username: 'author',
      email: 'author@cms.local',
      passwordHash: this.hashPassword('author123'),
      role: 'author',
      createdAt: new Date(),
      lastLogin: new Date()
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(editorUser.id, editorUser);
    this.users.set(authorUser.id, authorUser);
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Authentication routes
    this.post('/api/auth/login', this.handleLogin.bind(this));
    this.post('/api/auth/logout', this.requireAuth, this.handleLogout.bind(this));
    this.get('/api/auth/validate', this.requireAuth, this.handleValidate.bind(this));

    // User routes
    this.get('/api/users', this.requireAuth, this.requireRole(['admin']), this.handleGetUsers.bind(this));
    this.post('/api/users', this.requireAuth, this.requireRole(['admin']), this.handleCreateUser.bind(this));
    this.put('/api/users/:id', this.requireAuth, this.requireRole(['admin']), this.handleUpdateUser.bind(this));
    this.delete('/api/users/:id', this.requireAuth, this.requireRole(['admin']), this.handleDeleteUser.bind(this));

    // Dashboard routes
    this.get('/api/dashboard/stats', this.requireAuth, this.handleDashboardStats.bind(this));

    // Article routes (handled by content module)
    this.get('/api/articles', this.handleGetArticles.bind(this));
    this.get('/api/articles/:id', this.handleGetArticle.bind(this));
    this.post('/api/articles', this.requireAuth, this.requireRole(['admin', 'editor', 'author']), this.handleCreateArticle.bind(this));
    this.put('/api/articles/:id', this.requireAuth, this.handleUpdateArticle.bind(this));
    this.delete('/api/articles/:id', this.requireAuth, this.requireRole(['admin', 'editor']), this.handleDeleteArticle.bind(this));
    this.patch('/api/articles/:id/status', this.requireAuth, this.handleChangeArticleStatus.bind(this));

    // Category routes
    this.get('/api/categories', this.handleGetCategories.bind(this));
    this.post('/api/categories', this.requireAuth, this.requireRole(['admin', 'editor']), this.handleCreateCategory.bind(this));

    // Comment routes
    this.get('/api/comments', this.requireAuth, this.handleGetComments.bind(this));
    this.patch('/api/comments/:id/status', this.requireAuth, this.requireRole(['admin', 'editor']), this.handleUpdateCommentStatus.bind(this));

    // Media routes (handled by media module)
    this.get('/api/media', this.requireAuth, this.handleGetMedia.bind(this));
    this.post('/api/media/upload', this.requireAuth, this.handleUploadMedia.bind(this));
    this.patch('/api/media/:id', this.requireAuth, this.handleUpdateMedia.bind(this));
    this.delete('/api/media/:id', this.requireAuth, this.handleDeleteMedia.bind(this));
    this.get('/api/media/folders', this.requireAuth, this.handleGetFolders.bind(this));
    this.post('/api/media/folders', this.requireAuth, this.handleCreateFolder.bind(this));

    // Search routes
    this.get('/api/search', this.handleSearch.bind(this));
  }

  /**
   * Register GET route
   */
  private get(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('GET', path, handlers);
  }

  /**
   * Register POST route
   */
  private post(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('POST', path, handlers);
  }

  /**
   * Register PUT route
   */
  private put(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('PUT', path, handlers);
  }

  /**
   * Register PATCH route
   */
  private patch(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('PATCH', path, handlers);
  }

  /**
   * Register DELETE route
   */
  private delete(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('DELETE', path, handlers);
  }

  /**
   * Add route to router
   */
  private addRoute(method: string, path: string, handlers: (RouteHandler | Middleware)[]): void {
    const pathRegex = this.pathToRegex(path);
    const middleware = handlers.slice(0, -1) as Middleware[];
    const handler = handlers[handlers.length - 1] as RouteHandler;

    this.routes.push({
      method,
      path: pathRegex,
      handler,
      middleware
    });
  }

  /**
   * Convert path pattern to regex
   */
  private pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '(?<$1>[^/]+)');

    return new RegExp(`^${pattern}$`);
  }

  /**
   * Handle incoming request
   */
  async handleRequest(rawRequest: any): Promise<Response> {
    const url = new URL(rawRequest.url, `http://localhost:${this.port}`);

    const request: Request = {
      method: rawRequest.method,
      url: rawRequest.url,
      path: url.pathname,
      query: url.searchParams,
      params: {},
      headers: new Map(Object.entries(rawRequest.headers || {})),
      body: rawRequest.body
    };

    const response: Response = {
      statusCode: 200,
      headers: new Map([
        ['Content-Type', 'application/json'],
        ['Access-Control-Allow-Origin', '*']
      ]),
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.body = JSON.stringify(data);
        return this;
      },
      send(data: any) {
        this.body = data;
        return this;
      },
      setHeader(name: string, value: string) {
        this.headers.set(name, value);
        return this;
      }
    };

    try {
      // Find matching route
      const route = this.findRoute(request);

      if (!route) {
        return response.status(404).json({ error: 'Not found' });
      }

      // Execute middleware chain
      if (route.middleware) {
        for (const middleware of route.middleware) {
          let nextCalled = false;
          const next = () => { nextCalled = true; };

          await middleware(request, response, next);

          if (!nextCalled) {
            return response;
          }
        }
      }

      // Execute route handler
      await route.handler(request, response);

      return response;
    } catch (error) {
      console.error('Request error:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Find matching route
   */
  private findRoute(request: Request): Route | null {
    for (const route of this.routes) {
      if (route.method !== request.method) {
        continue;
      }

      const match = request.path.match(route.path);
      if (match) {
        request.params = match.groups || {};
        return route;
      }
    }

    return null;
  }

  /**
   * Authentication middleware
   */
  private requireAuth: Middleware = async (req, res, next) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7);
    const session = this.sessions.get(token);

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    const user = this.users.get(session.userId);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    req.session = session;
    next();
  };

  /**
   * Role authorization middleware
   */
  private requireRole(roles: string[]): Middleware {
    return async (req, res, next) => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    };
  }

  /**
   * Handle login
   */
  private async handleLogin(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    // Find user by username
    let user: User | undefined;
    for (const u of this.users.values()) {
      if (u.username === username) {
        user = u;
        break;
      }
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const passwordHash = this.hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Create session
    const session = this.createSession(user.id);

    // Update last login
    user.lastLogin = new Date();

    res.json({
      token: session.token,
      user: this.sanitizeUser(user)
    });
  }

  /**
   * Handle logout
   */
  private async handleLogout(req: Request, res: Response): Promise<void> {
    if (req.session) {
      this.sessions.delete(req.session.token);
    }

    res.json({ message: 'Logged out successfully' });
  }

  /**
   * Handle session validation
   */
  private async handleValidate(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    res.json({ user: this.sanitizeUser(req.user) });
  }

  /**
   * Handle get users
   */
  private async handleGetUsers(req: Request, res: Response): Promise<void> {
    const users = Array.from(this.users.values()).map(u => this.sanitizeUser(u));
    res.json(users);
  }

  /**
   * Handle create user
   */
  private async handleCreateUser(req: Request, res: Response): Promise<void> {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if username exists
    for (const user of this.users.values()) {
      if (user.username === username) {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }
    }

    const user: User = {
      id: this.generateId(),
      username,
      email,
      passwordHash: this.hashPassword(password),
      role,
      createdAt: new Date(),
      lastLogin: new Date()
    };

    this.users.set(user.id, user);

    res.status(201).json(this.sanitizeUser(user));
  }

  /**
   * Handle update user
   */
  private async handleUpdateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = this.users.get(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updates = req.body;

    if (updates.username) user.username = updates.username;
    if (updates.email) user.email = updates.email;
    if (updates.role) user.role = updates.role;
    if (updates.password) user.passwordHash = this.hashPassword(updates.password);

    res.json(this.sanitizeUser(user));
  }

  /**
   * Handle delete user
   */
  private async handleDeleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!this.users.has(id)) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    this.users.delete(id);
    res.status(204).send('');
  }

  /**
   * Handle dashboard stats
   */
  private async handleDashboardStats(req: Request, res: Response): Promise<void> {
    // Mock stats for showcase
    res.json({
      totalArticles: 42,
      publishedArticles: 35,
      draftArticles: 7,
      totalViews: 12543,
      totalComments: 156,
      pendingComments: 8,
      totalUsers: this.users.size,
      recentArticles: [],
      popularArticles: []
    });
  }

  /**
   * Placeholder handlers for other routes
   */
  private async handleGetArticles(req: Request, res: Response): Promise<void> {
    res.json({ articles: [], total: 0, page: 1, pages: 0 });
  }

  private async handleGetArticle(req: Request, res: Response): Promise<void> {
    res.status(404).json({ error: 'Article not found' });
  }

  private async handleCreateArticle(req: Request, res: Response): Promise<void> {
    res.status(201).json({ id: this.generateId(), ...req.body });
  }

  private async handleUpdateArticle(req: Request, res: Response): Promise<void> {
    res.json({ id: req.params.id, ...req.body });
  }

  private async handleDeleteArticle(req: Request, res: Response): Promise<void> {
    res.status(204).send('');
  }

  private async handleChangeArticleStatus(req: Request, res: Response): Promise<void> {
    res.json({ id: req.params.id, status: req.body.status });
  }

  private async handleGetCategories(req: Request, res: Response): Promise<void> {
    res.json([]);
  }

  private async handleCreateCategory(req: Request, res: Response): Promise<void> {
    res.status(201).json({ id: this.generateId(), ...req.body });
  }

  private async handleGetComments(req: Request, res: Response): Promise<void> {
    res.json([]);
  }

  private async handleUpdateCommentStatus(req: Request, res: Response): Promise<void> {
    res.json({ id: req.params.id, status: req.body.status });
  }

  private async handleGetMedia(req: Request, res: Response): Promise<void> {
    res.json([]);
  }

  private async handleUploadMedia(req: Request, res: Response): Promise<void> {
    res.status(201).json({ id: this.generateId(), url: '/uploads/example.jpg' });
  }

  private async handleUpdateMedia(req: Request, res: Response): Promise<void> {
    res.json({ id: req.params.id, ...req.body });
  }

  private async handleDeleteMedia(req: Request, res: Response): Promise<void> {
    res.status(204).send('');
  }

  private async handleGetFolders(req: Request, res: Response): Promise<void> {
    res.json([]);
  }

  private async handleCreateFolder(req: Request, res: Response): Promise<void> {
    res.status(201).json({ id: this.generateId(), ...req.body });
  }

  private async handleSearch(req: Request, res: Response): Promise<void> {
    res.json({ articles: [], media: [], total: 0 });
  }

  /**
   * Create session for user
   */
  private createSession(userId: string): Session {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const session: Session = {
      token,
      userId,
      expiresAt,
      createdAt: new Date()
    };

    this.sessions.set(token, session);
    return session;
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Hash password
   */
  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    console.log(`API Server listening on port ${this.port}`);
    console.log(`Available routes: ${this.routes.length}`);
    console.log(`Default users: admin/admin123, editor/editor123, author/author123`);
  }
}

// Export server instance
export const apiServer = new ApiServer();
