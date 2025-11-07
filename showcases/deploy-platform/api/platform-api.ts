/**
 * Deploy Platform - Platform API
 *
 * Main API server for the deployment platform.
 * Handles projects, deployments, domains, and user management.
 */

import { createHash, randomBytes } from 'crypto';

interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  teams: string[];
  createdAt: Date;
  lastLogin: Date;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  members: TeamMember[];
  createdAt: Date;
}

interface TeamMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

interface Project {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  framework?: string;
  gitProvider?: string;
  repository?: string;
  branch: string;
  rootDirectory?: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  environmentVariables: Record<string, EnvironmentVariable>;
  domains: Domain[];
  createdAt: Date;
  updatedAt: Date;
}

interface EnvironmentVariable {
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  createdAt: Date;
}

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  sslCertificate?: string;
  createdAt: Date;
  verifiedAt?: Date;
}

interface Deployment {
  id: string;
  projectId: string;
  teamId: string;
  userId: string;
  status: 'queued' | 'building' | 'deploying' | 'ready' | 'error' | 'canceled';
  url: string;
  alias?: string[];
  branch: string;
  commit: string;
  commitMessage: string;
  source: 'git' | 'cli' | 'api';
  meta?: Record<string, any>;
  buildOutput?: string;
  errorMessage?: string;
  createdAt: Date;
  buildStartedAt?: Date;
  buildCompletedAt?: Date;
  deployedAt?: Date;
  buildTime?: number;
  deployTime?: number;
}

interface BuildLog {
  deploymentId: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: string;
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
  team?: Team;
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
 * Platform API Server
 */
export class PlatformAPI {
  private routes: Route[] = [];
  private users: Map<string, User> = new Map();
  private teams: Map<string, Team> = new Map();
  private projects: Map<string, Project> = new Map();
  private deployments: Map<string, Deployment> = new Map();
  private buildLogs: Map<string, BuildLog[]> = new Map();
  private tokens: Map<string, string> = new Map(); // token -> userId
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.setupRoutes();
    this.initializeData();
  }

  /**
   * Initialize sample data
   */
  private initializeData(): void {
    // Create default user
    const user: User = {
      id: this.generateId('usr'),
      email: 'demo@deploy-platform.io',
      name: 'Demo User',
      passwordHash: this.hashPassword('demo123'),
      teams: [],
      createdAt: new Date(),
      lastLogin: new Date()
    };

    this.users.set(user.id, user);

    // Create default team
    const team: Team = {
      id: this.generateId('team'),
      name: 'Personal',
      slug: 'personal',
      members: [{
        userId: user.id,
        role: 'owner',
        joinedAt: new Date()
      }],
      createdAt: new Date()
    };

    this.teams.set(team.id, team);
    user.teams.push(team.id);

    // Create sample project
    const project: Project = {
      id: this.generateId('prj'),
      teamId: team.id,
      name: 'my-app',
      slug: 'my-app',
      framework: 'nextjs',
      gitProvider: 'github',
      repository: 'user/my-app',
      branch: 'main',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      installCommand: 'npm install',
      environmentVariables: {},
      domains: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(project.id, project);
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.get('/health', this.handleHealth.bind(this));

    // Authentication
    this.post('/auth/login', this.handleLogin.bind(this));
    this.post('/auth/register', this.handleRegister.bind(this));
    this.post('/auth/logout', this.requireAuth, this.handleLogout.bind(this));
    this.get('/auth/user', this.requireAuth, this.handleGetUser.bind(this));

    // Teams
    this.get('/teams', this.requireAuth, this.handleGetTeams.bind(this));
    this.post('/teams', this.requireAuth, this.handleCreateTeam.bind(this));
    this.get('/teams/:teamId', this.requireAuth, this.handleGetTeam.bind(this));
    this.patch('/teams/:teamId', this.requireAuth, this.handleUpdateTeam.bind(this));
    this.delete('/teams/:teamId', this.requireAuth, this.handleDeleteTeam.bind(this));

    // Team members
    this.post('/teams/:teamId/members', this.requireAuth, this.handleAddTeamMember.bind(this));
    this.delete('/teams/:teamId/members/:userId', this.requireAuth, this.handleRemoveTeamMember.bind(this));

    // Projects
    this.get('/projects', this.requireAuth, this.handleGetProjects.bind(this));
    this.post('/projects', this.requireAuth, this.handleCreateProject.bind(this));
    this.get('/projects/:projectId', this.requireAuth, this.handleGetProject.bind(this));
    this.patch('/projects/:projectId', this.requireAuth, this.handleUpdateProject.bind(this));
    this.delete('/projects/:projectId', this.requireAuth, this.handleDeleteProject.bind(this));

    // Environment variables
    this.get('/projects/:projectId/env', this.requireAuth, this.handleGetEnvVars.bind(this));
    this.post('/projects/:projectId/env', this.requireAuth, this.handleAddEnvVar.bind(this));
    this.patch('/projects/:projectId/env/:key', this.requireAuth, this.handleUpdateEnvVar.bind(this));
    this.delete('/projects/:projectId/env/:key', this.requireAuth, this.handleDeleteEnvVar.bind(this));

    // Domains
    this.get('/projects/:projectId/domains', this.requireAuth, this.handleGetDomains.bind(this));
    this.post('/projects/:projectId/domains', this.requireAuth, this.handleAddDomain.bind(this));
    this.delete('/projects/:projectId/domains/:domainId', this.requireAuth, this.handleRemoveDomain.bind(this));
    this.post('/projects/:projectId/domains/:domainId/verify', this.requireAuth, this.handleVerifyDomain.bind(this));

    // Deployments
    this.get('/projects/:projectId/deployments', this.requireAuth, this.handleGetDeployments.bind(this));
    this.post('/projects/:projectId/deployments', this.requireAuth, this.handleCreateDeployment.bind(this));
    this.get('/deployments/:deploymentId', this.requireAuth, this.handleGetDeployment.bind(this));
    this.post('/deployments/:deploymentId/cancel', this.requireAuth, this.handleCancelDeployment.bind(this));
    this.post('/deployments/:deploymentId/promote', this.requireAuth, this.handlePromoteDeployment.bind(this));
    this.post('/deployments/:deploymentId/rollback', this.requireAuth, this.handleRollbackDeployment.bind(this));

    // Build logs
    this.get('/deployments/:deploymentId/logs', this.requireAuth, this.handleGetLogs.bind(this));
    this.post('/deployments/:deploymentId/logs', this.requireAuth, this.handleAddLog.bind(this));

    // Analytics
    this.get('/projects/:projectId/analytics', this.requireAuth, this.handleGetAnalytics.bind(this));
  }

  // Route registration helpers
  private get(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('GET', path, handlers);
  }

  private post(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('POST', path, handlers);
  }

  private patch(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('PATCH', path, handlers);
  }

  private delete(path: string, ...handlers: (RouteHandler | Middleware)[]): void {
    this.addRoute('DELETE', path, handlers);
  }

  private addRoute(method: string, path: string, handlers: (RouteHandler | Middleware)[]): void {
    const pathRegex = this.pathToRegex(path);
    const middleware = handlers.slice(0, -1) as Middleware[];
    const handler = handlers[handlers.length - 1] as RouteHandler;

    this.routes.push({ method, path: pathRegex, handler, middleware });
  }

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
      const route = this.findRoute(request);

      if (!route) {
        return response.status(404).json({ error: 'Not found' });
      }

      // Execute middleware
      if (route.middleware) {
        for (const middleware of route.middleware) {
          let nextCalled = false;
          const next = () => { nextCalled = true; };
          await middleware(request, response, next);
          if (!nextCalled) return response;
        }
      }

      await route.handler(request, response);
      return response;
    } catch (error) {
      console.error('Request error:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  private findRoute(request: Request): Route | null {
    for (const route of this.routes) {
      if (route.method !== request.method) continue;

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
    const userId = this.tokens.get(token);

    if (!userId) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const user = this.users.get(userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  };

  /**
   * Route handlers
   */
  private async handleHealth(req: Request, res: Response): Promise<void> {
    res.json({ status: 'ok', timestamp: new Date() });
  }

  private async handleLogin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    let user: User | undefined;
    for (const u of this.users.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user || user.passwordHash !== this.hashPassword(password)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    user.lastLogin = new Date();
    const token = this.generateToken();
    this.tokens.set(token, user.id);

    res.json({ token, user: this.sanitizeUser(user) });
  }

  private async handleRegister(req: Request, res: Response): Promise<void> {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      res.status(400).json({ error: 'Email, name, and password required' });
      return;
    }

    // Check if user exists
    for (const user of this.users.values()) {
      if (user.email === email) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }
    }

    const user: User = {
      id: this.generateId('usr'),
      email,
      name,
      passwordHash: this.hashPassword(password),
      teams: [],
      createdAt: new Date(),
      lastLogin: new Date()
    };

    this.users.set(user.id, user);

    // Create personal team
    const team: Team = {
      id: this.generateId('team'),
      name: `${name}'s Team`,
      slug: email.split('@')[0],
      members: [{ userId: user.id, role: 'owner', joinedAt: new Date() }],
      createdAt: new Date()
    };

    this.teams.set(team.id, team);
    user.teams.push(team.id);

    const token = this.generateToken();
    this.tokens.set(token, user.id);

    res.status(201).json({ token, user: this.sanitizeUser(user) });
  }

  private async handleLogout(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.substring(7);
      this.tokens.delete(token);
    }

    res.json({ message: 'Logged out' });
  }

  private async handleGetUser(req: Request, res: Response): Promise<void> {
    res.json(this.sanitizeUser(req.user!));
  }

  private async handleGetTeams(req: Request, res: Response): Promise<void> {
    const userTeams = req.user!.teams
      .map(teamId => this.teams.get(teamId))
      .filter(Boolean);

    res.json(userTeams);
  }

  private async handleCreateTeam(req: Request, res: Response): Promise<void> {
    const { name, slug } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: 'Name and slug required' });
      return;
    }

    const team: Team = {
      id: this.generateId('team'),
      name,
      slug,
      members: [{ userId: req.user!.id, role: 'owner', joinedAt: new Date() }],
      createdAt: new Date()
    };

    this.teams.set(team.id, team);
    req.user!.teams.push(team.id);

    res.status(201).json(team);
  }

  private async handleGetTeam(req: Request, res: Response): Promise<void> {
    const team = this.teams.get(req.params.teamId);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.json(team);
  }

  private async handleUpdateTeam(req: Request, res: Response): Promise<void> {
    const team = this.teams.get(req.params.teamId);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const { name, slug } = req.body;
    if (name) team.name = name;
    if (slug) team.slug = slug;

    res.json(team);
  }

  private async handleDeleteTeam(req: Request, res: Response): Promise<void> {
    this.teams.delete(req.params.teamId);
    res.status(204).send('');
  }

  private async handleAddTeamMember(req: Request, res: Response): Promise<void> {
    const team = this.teams.get(req.params.teamId);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const { userId, role } = req.body;
    team.members.push({ userId, role, joinedAt: new Date() });

    res.status(201).json(team);
  }

  private async handleRemoveTeamMember(req: Request, res: Response): Promise<void> {
    const team = this.teams.get(req.params.teamId);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    team.members = team.members.filter(m => m.userId !== req.params.userId);
    res.json(team);
  }

  private async handleGetProjects(req: Request, res: Response): Promise<void> {
    const teamId = req.query.get('teamId');
    let projects = Array.from(this.projects.values());

    if (teamId) {
      projects = projects.filter(p => p.teamId === teamId);
    }

    res.json(projects);
  }

  private async handleCreateProject(req: Request, res: Response): Promise<void> {
    const { teamId, name, framework, repository, branch } = req.body;

    if (!teamId || !name) {
      res.status(400).json({ error: 'Team ID and name required' });
      return;
    }

    const project: Project = {
      id: this.generateId('prj'),
      teamId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      framework,
      repository,
      branch: branch || 'main',
      environmentVariables: {},
      domains: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(project.id, project);
    res.status(201).json(project);
  }

  private async handleGetProject(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  }

  private async handleUpdateProject(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updates = req.body;
    Object.assign(project, updates);
    project.updatedAt = new Date();

    res.json(project);
  }

  private async handleDeleteProject(req: Request, res: Response): Promise<void> {
    this.projects.delete(req.params.projectId);
    res.status(204).send('');
  }

  private async handleGetEnvVars(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(Object.values(project.environmentVariables));
  }

  private async handleAddEnvVar(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { key, value, target } = req.body;

    if (!key || !value) {
      res.status(400).json({ error: 'Key and value required' });
      return;
    }

    project.environmentVariables[key] = {
      key,
      value,
      target: target || ['production', 'preview', 'development'],
      createdAt: new Date()
    };

    res.status(201).json(project.environmentVariables[key]);
  }

  private async handleUpdateEnvVar(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const envVar = project.environmentVariables[req.params.key];

    if (!envVar) {
      res.status(404).json({ error: 'Environment variable not found' });
      return;
    }

    const { value, target } = req.body;
    if (value) envVar.value = value;
    if (target) envVar.target = target;

    res.json(envVar);
  }

  private async handleDeleteEnvVar(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    delete project.environmentVariables[req.params.key];
    res.status(204).send('');
  }

  private async handleGetDomains(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project.domains);
  }

  private async handleAddDomain(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { domain } = req.body;

    if (!domain) {
      res.status(400).json({ error: 'Domain required' });
      return;
    }

    const domainObj: Domain = {
      id: this.generateId('dom'),
      domain,
      verified: false,
      createdAt: new Date()
    };

    project.domains.push(domainObj);
    res.status(201).json(domainObj);
  }

  private async handleRemoveDomain(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    project.domains = project.domains.filter(d => d.id !== req.params.domainId);
    res.status(204).send('');
  }

  private async handleVerifyDomain(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const domain = project.domains.find(d => d.id === req.params.domainId);

    if (!domain) {
      res.status(404).json({ error: 'Domain not found' });
      return;
    }

    // Mock verification
    domain.verified = true;
    domain.verifiedAt = new Date();

    res.json(domain);
  }

  private async handleGetDeployments(req: Request, res: Response): Promise<void> {
    const deployments = Array.from(this.deployments.values())
      .filter(d => d.projectId === req.params.projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json(deployments);
  }

  private async handleCreateDeployment(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { branch, commit, commitMessage, source } = req.body;

    const deployment: Deployment = {
      id: this.generateId('dpl'),
      projectId: project.id,
      teamId: project.teamId,
      userId: req.user!.id,
      status: 'queued',
      url: `https://${project.slug}-${this.generateId('dep').substring(4, 11)}.deploy-platform.app`,
      branch: branch || project.branch,
      commit: commit || 'HEAD',
      commitMessage: commitMessage || 'Deploy via CLI',
      source: source || 'cli',
      createdAt: new Date()
    };

    this.deployments.set(deployment.id, deployment);
    res.status(201).json(deployment);
  }

  private async handleGetDeployment(req: Request, res: Response): Promise<void> {
    const deployment = this.deployments.get(req.params.deploymentId);

    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    res.json(deployment);
  }

  private async handleCancelDeployment(req: Request, res: Response): Promise<void> {
    const deployment = this.deployments.get(req.params.deploymentId);

    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    deployment.status = 'canceled';
    res.json(deployment);
  }

  private async handlePromoteDeployment(req: Request, res: Response): Promise<void> {
    const deployment = this.deployments.get(req.params.deploymentId);

    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    const project = this.projects.get(deployment.projectId);
    if (project && project.domains.length > 0) {
      deployment.alias = project.domains.map(d => `https://${d.domain}`);
    }

    res.json(deployment);
  }

  private async handleRollbackDeployment(req: Request, res: Response): Promise<void> {
    const deployment = this.deployments.get(req.params.deploymentId);

    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    // Create new deployment based on old one
    const newDeployment: Deployment = {
      ...deployment,
      id: this.generateId('dpl'),
      status: 'queued',
      createdAt: new Date()
    };

    this.deployments.set(newDeployment.id, newDeployment);
    res.status(201).json(newDeployment);
  }

  private async handleGetLogs(req: Request, res: Response): Promise<void> {
    const logs = this.buildLogs.get(req.params.deploymentId) || [];
    res.json(logs);
  }

  private async handleAddLog(req: Request, res: Response): Promise<void> {
    const { level, message, source } = req.body;

    const log: BuildLog = {
      deploymentId: req.params.deploymentId,
      timestamp: new Date(),
      level,
      message,
      source
    };

    if (!this.buildLogs.has(req.params.deploymentId)) {
      this.buildLogs.set(req.params.deploymentId, []);
    }

    this.buildLogs.get(req.params.deploymentId)!.push(log);
    res.status(201).json(log);
  }

  private async handleGetAnalytics(req: Request, res: Response): Promise<void> {
    const project = this.projects.get(req.params.projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Mock analytics
    res.json({
      totalDeployments: 42,
      successfulDeployments: 38,
      failedDeployments: 4,
      averageBuildTime: 15000,
      totalBandwidth: 1024 * 1024 * 1024 * 5.3, // 5.3 GB
      totalRequests: 125000,
      uniqueVisitors: 8542
    });
  }

  /**
   * Utility methods
   */
  private generateId(prefix: string): string {
    return `${prefix}_${randomBytes(12).toString('hex')}`;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    console.log(`Platform API listening on port ${this.port}`);
    console.log(`Routes: ${this.routes.length}`);
  }
}

export const platformAPI = new PlatformAPI();
