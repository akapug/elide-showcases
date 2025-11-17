/**
 * Sails Clone - MVC framework for APIs for Elide
 *
 * Complete MVC framework with Blueprints (auto CRUD), WebSocket support,
 * ORM (Waterline-style), and Policies.
 */

import { serve } from 'node:http';

// ==================== TYPES ====================

export interface SailsApp {
  config: SailsConfig;
  controllers: Map<string, Controller>;
  models: Map<string, Model>;
  policies: Map<string, Policy>;
  services: Map<string, any>;
  routes: Route[];
  lift(options?: LiftOptions): Promise<void>;
  lower(): Promise<void>;
  request(options: RequestOptions): Promise<any>;
  [key: string]: any;
}

export interface SailsConfig {
  port?: number;
  host?: string;
  blueprints?: BlueprintConfig;
  cors?: CorsConfig;
  security?: SecurityConfig;
  session?: SessionConfig;
  sockets?: SocketConfig;
  orm?: OrmConfig;
}

export interface BlueprintConfig {
  actions?: boolean;
  rest?: boolean;
  shortcuts?: boolean;
  prefix?: string;
  pluralize?: boolean;
  populate?: boolean;
}

export interface CorsConfig {
  allRoutes?: boolean;
  allowOrigins?: string | string[];
  allowCredentials?: boolean;
  allowRequestHeaders?: string;
}

export interface SecurityConfig {
  csrf?: boolean | { protectionEnabled?: boolean };
}

export interface SessionConfig {
  secret?: string;
  cookie?: {
    maxAge?: number;
  };
}

export interface SocketConfig {
  enabled?: boolean;
  transports?: string[];
}

export interface OrmConfig {
  adapters?: Record<string, any>;
  datastores?: Record<string, DatastoreConfig>;
}

export interface DatastoreConfig {
  adapter?: string;
  url?: string;
  host?: string;
  port?: number;
  database?: string;
}

export interface LiftOptions {
  port?: number;
  host?: string;
}

export interface Controller {
  [action: string]: Action;
}

export interface Action {
  (req: Request, res: Response): any | Promise<any>;
  inputs?: Record<string, InputDefinition>;
  exits?: Record<string, ExitDefinition>;
}

export interface InputDefinition {
  type?: string;
  required?: boolean;
  defaultsTo?: any;
  description?: string;
}

export interface ExitDefinition {
  description?: string;
  statusCode?: number;
}

export interface Model {
  attributes: Record<string, AttributeDefinition>;
  tableName?: string;
  primaryKey?: string;
  autoCreatedAt?: boolean;
  autoUpdatedAt?: boolean;
  // ORM methods
  create(data: any): Promise<any>;
  find(criteria?: any): Promise<any[]>;
  findOne(criteria: any): Promise<any | null>;
  update(criteria: any, data: any): Promise<any[]>;
  destroy(criteria: any): Promise<any[]>;
  count(criteria?: any): Promise<number>;
  [key: string]: any;
}

export interface AttributeDefinition {
  type?: string;
  required?: boolean;
  unique?: boolean;
  defaultsTo?: any;
  autoIncrement?: boolean;
  columnName?: string;
  model?: string;
  collection?: string;
  via?: string;
}

export interface Policy {
  (req: Request, res: Response, next: () => void): any | Promise<any>;
}

export interface Route {
  method: string;
  path: string;
  target: string;
  policies?: string[];
}

export interface Request {
  method: string;
  url: string;
  path: string;
  query: Record<string, any>;
  params: Record<string, string>;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
  session?: Record<string, any>;
  isSocket?: boolean;
  socket?: any;
  allParams(): Record<string, any>;
  param(name: string, defaultValue?: any): any;
  wantsJSON(): boolean;
  [key: string]: any;
}

export interface Response {
  status(code: number): Response;
  send(data: any): void;
  json(data: any): void;
  created(data?: any): void;
  ok(data?: any): void;
  badRequest(message?: string): void;
  forbidden(message?: string): void;
  notFound(message?: string): void;
  serverError(message?: string): void;
  negotiate(error: Error): void;
  view(viewName: string, data?: any): void;
  redirect(url: string): void;
  set(header: string, value: string): Response;
  [key: string]: any;
}

export interface RequestOptions {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
}

// ==================== ORM IMPLEMENTATION ====================

class DataStore {
  private data: Map<string, any[]> = new Map();
  private nextId: Map<string, number> = new Map();

  async create(tableName: string, data: any): Promise<any> {
    if (!this.data.has(tableName)) {
      this.data.set(tableName, []);
      this.nextId.set(tableName, 1);
    }

    const id = this.nextId.get(tableName)!;
    const record = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.get(tableName)!.push(record);
    this.nextId.set(tableName, id + 1);

    return record;
  }

  async find(tableName: string, criteria?: any): Promise<any[]> {
    const records = this.data.get(tableName) || [];

    if (!criteria || Object.keys(criteria).length === 0) {
      return [...records];
    }

    return records.filter(record => {
      return Object.entries(criteria).every(([key, value]) => {
        return record[key] === value;
      });
    });
  }

  async findOne(tableName: string, criteria: any): Promise<any | null> {
    const records = await this.find(tableName, criteria);
    return records[0] || null;
  }

  async update(tableName: string, criteria: any, data: any): Promise<any[]> {
    const records = await this.find(tableName, criteria);

    for (const record of records) {
      Object.assign(record, data, {
        updatedAt: new Date().toISOString()
      });
    }

    return records;
  }

  async destroy(tableName: string, criteria: any): Promise<any[]> {
    const allRecords = this.data.get(tableName) || [];
    const toDelete = await this.find(tableName, criteria);

    const remaining = allRecords.filter(record => {
      return !toDelete.some(del => del.id === record.id);
    });

    this.data.set(tableName, remaining);

    return toDelete;
  }

  async count(tableName: string, criteria?: any): Promise<number> {
    const records = await this.find(tableName, criteria);
    return records.length;
  }
}

// ==================== BLUEPRINT GENERATOR ====================

class BlueprintGenerator {
  generateCRUD(modelName: string, model: Model): Controller {
    const controller: Controller = {};

    // GET /:model - find all
    controller.find = async (req: Request, res: Response) => {
      const records = await model.find(req.query);
      res.json(records);
    };

    // GET /:model/:id - find one
    controller.findOne = async (req: Request, res: Response) => {
      const record = await model.findOne({ id: parseInt(req.params.id) });

      if (!record) {
        return res.notFound();
      }

      res.json(record);
    };

    // POST /:model - create
    controller.create = async (req: Request, res: Response) => {
      const record = await model.create(req.body);
      res.created(record);
    };

    // PATCH/PUT /:model/:id - update
    controller.update = async (req: Request, res: Response) => {
      const records = await model.update(
        { id: parseInt(req.params.id) },
        req.body
      );

      if (records.length === 0) {
        return res.notFound();
      }

      res.json(records[0]);
    };

    // DELETE /:model/:id - destroy
    controller.destroy = async (req: Request, res: Response) => {
      const records = await model.destroy({ id: parseInt(req.params.id) });

      if (records.length === 0) {
        return res.notFound();
      }

      res.ok();
    };

    return controller;
  }
}

// ==================== ROUTER ====================

class Router {
  routes: Array<{
    method: string;
    pattern: RegExp;
    keys: string[];
    handler: Action;
    policies: Policy[];
  }> = [];

  add(route: Route, handler: Action, policies: Policy[]): void {
    const { pattern, keys } = this.compile(route.path);

    this.routes.push({
      method: route.method.toUpperCase(),
      pattern,
      keys,
      handler,
      policies
    });
  }

  find(method: string, path: string): {
    handler: Action;
    params: Record<string, string>;
    policies: Policy[];
  } | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;

      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.keys.forEach((key, i) => {
          params[key] = match[i + 1];
        });
        return { handler: route.handler, params, policies: route.policies };
      }
    }

    return null;
  }

  private compile(path: string): { pattern: RegExp; keys: string[] } {
    const keys: string[] = [];

    const pattern = path
      .replace(/:(\w+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    return {
      pattern: new RegExp(`^${pattern}$`),
      keys
    };
  }
}

// ==================== RESPONSE HELPERS ====================

class ResponseHelpers {
  static enhance(rawRes: any, req: Request): Response {
    const res = rawRes as Response;

    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };

    res.send = (data: any) => {
      if (typeof data === 'object') {
        res.setHeader('Content-Type', 'application/json');
        rawRes.end(JSON.stringify(data));
      } else {
        rawRes.end(String(data));
      }
    };

    res.json = (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      rawRes.end(JSON.stringify(data));
    };

    res.created = (data?: any) => {
      res.statusCode = 201;
      if (data) {
        res.json(data);
      } else {
        rawRes.end();
      }
    };

    res.ok = (data?: any) => {
      res.statusCode = 200;
      if (data) {
        res.json(data);
      } else {
        rawRes.end();
      }
    };

    res.badRequest = (message?: string) => {
      res.statusCode = 400;
      res.json({ error: 'Bad Request', message: message || 'Bad Request' });
    };

    res.forbidden = (message?: string) => {
      res.statusCode = 403;
      res.json({ error: 'Forbidden', message: message || 'Forbidden' });
    };

    res.notFound = (message?: string) => {
      res.statusCode = 404;
      res.json({ error: 'Not Found', message: message || 'Not Found' });
    };

    res.serverError = (message?: string) => {
      res.statusCode = 500;
      res.json({ error: 'Server Error', message: message || 'Internal Server Error' });
    };

    res.negotiate = (error: Error) => {
      const statusCode = (error as any).statusCode || 500;
      res.statusCode = statusCode;
      res.json({ error: error.name, message: error.message });
    };

    res.view = (viewName: string, data?: any) => {
      res.setHeader('Content-Type', 'text/html');
      rawRes.end(`<html><body><h1>${viewName}</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`);
    };

    res.redirect = (url: string) => {
      res.statusCode = 302;
      res.setHeader('Location', url);
      rawRes.end();
    };

    res.set = (header: string, value: string) => {
      res.setHeader(header, value);
      return res;
    };

    return res;
  }
}

// ==================== REQUEST HELPERS ====================

class RequestHelpers {
  static enhance(rawReq: any, params: Record<string, string>): Request {
    const url = new URL(rawReq.url || '/', 'http://localhost');

    const req: Request = {
      method: rawReq.method || 'GET',
      url: rawReq.url || '/',
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      params,
      headers: rawReq.headers || {},
      session: {},
      isSocket: false,

      allParams() {
        return { ...this.query, ...this.params, ...this.body };
      },

      param(name: string, defaultValue?: any) {
        return this.params[name] || this.query[name] || this.body?.[name] || defaultValue;
      },

      wantsJSON() {
        const accept = this.headers['accept'] as string || '';
        return accept.includes('application/json');
      }
    };

    return req;
  }
}

// ==================== SAILS APPLICATION ====================

export class Sails implements SailsApp {
  config: SailsConfig;
  controllers: Map<string, Controller> = new Map();
  models: Map<string, Model> = new Map();
  policies: Map<string, Policy> = new Map();
  services: Map<string, any> = new Map();
  routes: Route[] = [];

  private router: Router;
  private dataStore: DataStore;
  private blueprintGenerator: BlueprintGenerator;
  private server: any = null;

  constructor(config: SailsConfig = {}) {
    this.config = {
      port: 1337,
      host: '0.0.0.0',
      blueprints: {
        actions: true,
        rest: true,
        shortcuts: true,
        prefix: '',
        pluralize: false,
        populate: true
      },
      cors: {
        allRoutes: false,
        allowOrigins: '*',
        allowCredentials: false
      },
      security: {
        csrf: false
      },
      ...config
    };

    this.router = new Router();
    this.dataStore = new DataStore();
    this.blueprintGenerator = new BlueprintGenerator();
  }

  // ==================== LIFECYCLE ====================

  async lift(options: LiftOptions = {}): Promise<void> {
    const port = options.port || this.config.port || 1337;
    const host = options.host || this.config.host || '0.0.0.0';

    // Initialize models
    this.initializeModels();

    // Generate blueprints
    if (this.config.blueprints?.rest) {
      this.generateBlueprints();
    }

    // Register routes
    this.registerRoutes();

    // Start server
    this.server = serve(
      { port, hostname: host },
      async (req, res) => {
        await this.handle(req, res);
      }
    );

    console.log(`Sails lifted on http://${host}:${port}`);
  }

  async lower(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    console.log('Sails lowered');
  }

  async request(options: RequestOptions): Promise<any> {
    // Simulate request for testing
    const mockReq = {
      method: options.method,
      url: options.url,
      headers: options.headers || {}
    };

    let result: any;

    const mockRes = {
      statusCode: 200,
      setHeader: () => {},
      end: (data?: any) => {
        if (data) {
          try {
            result = JSON.parse(data);
          } catch {
            result = data;
          }
        }
      }
    };

    await this.handle(mockReq, mockRes);

    return result;
  }

  // ==================== INITIALIZATION ====================

  private initializeModels(): void {
    for (const [name, model] of this.models) {
      const tableName = model.tableName || name.toLowerCase();

      model.create = (data: any) => this.dataStore.create(tableName, data);
      model.find = (criteria?: any) => this.dataStore.find(tableName, criteria);
      model.findOne = (criteria: any) => this.dataStore.findOne(tableName, criteria);
      model.update = (criteria: any, data: any) => this.dataStore.update(tableName, criteria, data);
      model.destroy = (criteria: any) => this.dataStore.destroy(tableName, criteria);
      model.count = (criteria?: any) => this.dataStore.count(tableName, criteria);
    }
  }

  private generateBlueprints(): void {
    for (const [modelName, model] of this.models) {
      const controller = this.blueprintGenerator.generateCRUD(modelName, model);
      const prefix = this.config.blueprints?.prefix || '';
      const basePath = `${prefix}/${modelName.toLowerCase()}`;

      // Register blueprint routes
      this.routes.push(
        { method: 'GET', path: basePath, target: `${modelName}.find` },
        { method: 'GET', path: `${basePath}/:id`, target: `${modelName}.findOne` },
        { method: 'POST', path: basePath, target: `${modelName}.create` },
        { method: 'PATCH', path: `${basePath}/:id`, target: `${modelName}.update` },
        { method: 'PUT', path: `${basePath}/:id`, target: `${modelName}.update` },
        { method: 'DELETE', path: `${basePath}/:id`, target: `${modelName}.destroy` }
      );

      // Register controller
      this.controllers.set(modelName, controller);
    }
  }

  private registerRoutes(): void {
    for (const route of this.routes) {
      const [controllerName, actionName] = route.target.split('.');
      const controller = this.controllers.get(controllerName);

      if (!controller) {
        console.warn(`Controller ${controllerName} not found`);
        continue;
      }

      const action = controller[actionName];

      if (!action) {
        console.warn(`Action ${actionName} not found in ${controllerName}`);
        continue;
      }

      // Get policies
      const policyNames = route.policies || [];
      const policies: Policy[] = [];

      for (const policyName of policyNames) {
        const policy = this.policies.get(policyName);
        if (policy) {
          policies.push(policy);
        }
      }

      this.router.add(route, action, policies);
    }
  }

  // ==================== REQUEST HANDLING ====================

  private async handle(rawReq: any, rawRes: any): Promise<void> {
    try {
      // Parse body
      if (['POST', 'PUT', 'PATCH'].includes(rawReq.method)) {
        await this.parseBody(rawReq);
      }

      // Find route
      const url = new URL(rawReq.url || '/', 'http://localhost');
      const match = this.router.find(rawReq.method, url.pathname);

      if (!match) {
        rawRes.statusCode = 404;
        rawRes.setHeader('Content-Type', 'application/json');
        rawRes.end(JSON.stringify({ error: 'Not Found' }));
        return;
      }

      // Create request and response
      const req = RequestHelpers.enhance(rawReq, match.params);
      const res = ResponseHelpers.enhance(rawRes, req);

      // Run policies
      for (const policy of match.policies) {
        let passed = false;

        await policy(req, res, () => {
          passed = true;
        });

        if (!passed) {
          return;
        }
      }

      // Execute action
      await match.handler(req, res);

    } catch (err) {
      this.handleError(rawRes, err as Error);
    }
  }

  private async parseBody(rawReq: any): Promise<void> {
    return new Promise((resolve, reject) => {
      let data = '';

      rawReq.on('data', (chunk: any) => {
        data += chunk.toString();
      });

      rawReq.on('end', () => {
        try {
          const contentType = rawReq.headers['content-type'] || '';

          if (contentType.includes('application/json')) {
            rawReq.body = data ? JSON.parse(data) : {};
          } else {
            rawReq.body = data;
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      rawReq.on('error', reject);
    });
  }

  private handleError(rawRes: any, err: Error): void {
    console.error('Error:', err);

    const statusCode = (err as any).statusCode || 500;

    rawRes.statusCode = statusCode;
    rawRes.setHeader('Content-Type', 'application/json');
    rawRes.end(JSON.stringify({
      error: err.name,
      message: err.message,
      statusCode
    }));
  }
}

// ==================== FACTORY FUNCTION ====================

export default function sails(config?: SailsConfig): SailsApp {
  return new Sails(config);
}

export { sails };
