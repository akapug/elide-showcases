/**
 * Hapi Clone - Configuration-centric framework for Elide
 *
 * Plugin system, validation with Joi-like schemas, authentication strategies,
 * and comprehensive route configuration.
 */

import { serve } from 'node:http';

// ==================== TYPES ====================

export interface Server {
  info: ServerInfo;
  settings: ServerSettings;
  route(options: RouteOptions | RouteOptions[]): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  register(plugin: Plugin, options?: any): Promise<void>;
  ext(event: string, method: ExtMethod): void;
  auth: {
    strategy(name: string, scheme: string, options?: any): void;
    default(name: string): void;
  };
  inject(options: InjectOptions): Promise<InjectResponse>;
  [key: string]: any;
}

export interface ServerInfo {
  port: number;
  host: string;
  protocol: string;
  uri: string;
}

export interface ServerSettings {
  port: number;
  host: string;
  routes?: {
    cors?: boolean | CorsOptions;
    validate?: { options?: any };
  };
}

export interface RouteOptions {
  method: string | string[];
  path: string;
  handler: RouteHandler;
  options?: {
    auth?: string | false | { strategy: string; mode?: string };
    validate?: {
      params?: any;
      query?: any;
      payload?: any;
      headers?: any;
    };
    cors?: boolean | CorsOptions;
    description?: string;
    notes?: string | string[];
    tags?: string[];
    plugins?: Record<string, any>;
    response?: {
      schema?: any;
      status?: Record<number, any>;
    };
  };
}

export type RouteHandler = (request: Request, h: ResponseToolkit) => any | Promise<any>;

export interface Request {
  method: string;
  url: URL;
  path: string;
  query: Record<string, any>;
  params: Record<string, string>;
  payload?: any;
  headers: Record<string, string | string[] | undefined>;
  auth?: {
    isAuthenticated: boolean;
    credentials?: any;
    strategy?: string;
  };
  info: {
    remoteAddress: string;
    host: string;
  };
  server: Server;
  route: RouteOptions;
  [key: string]: any;
}

export interface ResponseToolkit {
  response(value?: any): Response;
  redirect(uri: string): Response;
  authenticated(data: { credentials: any }): void;
  unauthenticated(error: Error): void;
  continue: symbol;
}

export interface Response {
  code(statusCode: number): Response;
  type(mimeType: string): Response;
  header(name: string, value: string): Response;
  state(name: string, value: any, options?: any): Response;
  unstate(name: string): Response;
  [key: string]: any;
}

export interface Plugin {
  name: string;
  version?: string;
  register(server: Server, options?: any): Promise<void> | void;
  dependencies?: string[];
  requirements?: {
    hapi?: string;
    node?: string;
  };
}

export interface InjectOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  payload?: any;
  auth?: {
    strategy: string;
    credentials: any;
  };
}

export interface InjectResponse {
  statusCode: number;
  headers: Record<string, string>;
  payload: string;
  result: any;
}

export interface CorsOptions {
  origin?: string[];
  maxAge?: number;
  headers?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
}

export type ExtMethod = (request: Request, h: ResponseToolkit) => any | Promise<any>;

// ==================== RESPONSE TOOLKIT ====================

const CONTINUE = Symbol('continue');

class ResponseToolkitImpl implements ResponseToolkit {
  continue = CONTINUE;

  response(value?: any): Response {
    return new ResponseImpl(value);
  }

  redirect(uri: string): Response {
    const response = new ResponseImpl();
    response._statusCode = 302;
    response._headers.set('location', uri);
    return response;
  }

  authenticated(data: { credentials: any }): void {
    // Set authentication data
  }

  unauthenticated(error: Error): void {
    throw error;
  }
}

// ==================== RESPONSE ====================

class ResponseImpl implements Response {
  _value: any;
  _statusCode: number = 200;
  _type: string = 'application/json';
  _headers: Map<string, string> = new Map();
  _state: Map<string, any> = new Map();

  constructor(value?: any) {
    this._value = value;
  }

  code(statusCode: number): Response {
    this._statusCode = statusCode;
    return this;
  }

  type(mimeType: string): Response {
    this._type = mimeType;
    return this;
  }

  header(name: string, value: string): Response {
    this._headers.set(name.toLowerCase(), value);
    return this;
  }

  state(name: string, value: any, options?: any): Response {
    this._state.set(name, value);
    return this;
  }

  unstate(name: string): Response {
    this._state.delete(name);
    return this;
  }
}

// ==================== ROUTER ====================

class Router {
  routes: Array<{
    method: string[];
    pattern: RegExp;
    keys: string[];
    handler: RouteHandler;
    options: RouteOptions;
  }> = [];

  add(options: RouteOptions): void {
    const methods = Array.isArray(options.method)
      ? options.method
      : [options.method];

    const { pattern, keys } = this.compile(options.path);

    this.routes.push({
      method: methods.map(m => m.toUpperCase()),
      pattern,
      keys,
      handler: options.handler,
      options
    });
  }

  find(method: string, path: string): {
    handler: RouteHandler;
    params: Record<string, string>;
    options: RouteOptions;
  } | null {
    for (const route of this.routes) {
      if (!route.method.includes(method.toUpperCase())) continue;

      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.keys.forEach((key, i) => {
          params[key] = match[i + 1];
        });
        return { handler: route.handler, params, options: route.options };
      }
    }

    return null;
  }

  private compile(path: string): { pattern: RegExp; keys: string[] } {
    const keys: string[] = [];

    const pattern = path
      .replace(/\{(\w+)(\*)?(\d+)?\}/g, (_, key, wildcard, count) => {
        keys.push(key);
        if (wildcard) return '(.*)';
        if (count) return `([^/]{${count}})`;
        return '([^/]+)';
      });

    return {
      pattern: new RegExp(`^${pattern}$`),
      keys
    };
  }
}

// ==================== PLUGIN MANAGER ====================

class PluginManager {
  plugins: Map<string, Plugin> = new Map();

  async register(server: Server, plugin: Plugin, options?: any): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin ${plugin.name} depends on ${dep} which is not registered`);
        }
      }
    }

    await plugin.register(server, options);
    this.plugins.set(plugin.name, plugin);
  }
}

// ==================== AUTH MANAGER ====================

class AuthManager {
  strategies: Map<string, { scheme: string; options: any }> = new Map();
  defaultStrategy?: string;

  strategy(name: string, scheme: string, options?: any): void {
    this.strategies.set(name, { scheme, options });
  }

  default(name: string): void {
    if (!this.strategies.has(name)) {
      throw new Error(`Strategy ${name} not found`);
    }
    this.defaultStrategy = name;
  }

  async authenticate(request: Request, strategyName?: string): Promise<void> {
    const name = strategyName || this.defaultStrategy;

    if (!name) {
      request.auth = { isAuthenticated: false };
      return;
    }

    const strategy = this.strategies.get(name);

    if (!strategy) {
      throw new Error(`Strategy ${name} not found`);
    }

    // Simple token-based auth for demo
    const authHeader = request.headers['authorization'] as string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      request.auth = {
        isAuthenticated: true,
        credentials: { token: authHeader.substring(7) },
        strategy: name
      };
    } else {
      request.auth = { isAuthenticated: false };
    }
  }
}

// ==================== VALIDATOR ====================

class Validator {
  validate(schema: any, data: any): { error?: Error; value: any } {
    // Simple validation - in production use Joi
    if (!schema) return { value: data };

    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties as any)) {
        if (schema.required?.includes(key) && !(key in data)) {
          return {
            error: new Error(`"${key}" is required`),
            value: data
          };
        }
      }
    }

    return { value: data };
  }
}

// ==================== SERVER IMPLEMENTATION ====================

export class HapiServer implements Server {
  info: ServerInfo;
  settings: ServerSettings;
  router: Router;
  pluginManager: PluginManager;
  authManager: AuthManager;
  validator: Validator;
  extensions: Map<string, ExtMethod[]> = new Map();
  decorations: Map<string, any> = new Map();
  private server: any = null;
  private started: boolean = false;

  constructor(options: { port: number; host?: string; routes?: any }) {
    const { port, host = '0.0.0.0', routes } = options;

    this.settings = { port, host, routes };
    this.info = {
      port,
      host,
      protocol: 'http',
      uri: `http://${host}:${port}`
    };

    this.router = new Router();
    this.pluginManager = new PluginManager();
    this.authManager = new AuthManager();
    this.validator = new Validator();

    this.auth = {
      strategy: (name: string, scheme: string, options?: any) => {
        this.authManager.strategy(name, scheme, options);
      },
      default: (name: string) => {
        this.authManager.default(name);
      }
    };
  }

  auth: {
    strategy(name: string, scheme: string, options?: any): void;
    default(name: string): void;
  };

  route(options: RouteOptions | RouteOptions[]): void {
    const routes = Array.isArray(options) ? options : [options];

    for (const route of routes) {
      this.router.add(route);
    }
  }

  async start(): Promise<void> {
    this.server = serve(
      { port: this.settings.port, hostname: this.settings.host },
      async (req, res) => {
        await this.handle(req, res);
      }
    );

    this.started = true;
    console.log(`Server started at ${this.info.uri}`);
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    this.started = false;
    console.log('Server stopped');
  }

  async register(plugin: Plugin, options?: any): Promise<void> {
    await this.pluginManager.register(this, plugin, options);
  }

  ext(event: string, method: ExtMethod): void {
    if (!this.extensions.has(event)) {
      this.extensions.set(event, []);
    }
    this.extensions.get(event)!.push(method);
  }

  async inject(options: InjectOptions): Promise<InjectResponse> {
    const mockReq = {
      method: options.method,
      url: options.url,
      headers: options.headers || {}
    };

    let statusCode = 200;
    let headers: Record<string, string> = {};
    let payload = '';

    const mockRes = {
      statusCode: 200,
      setHeader: (name: string, value: any) => {
        headers[name] = String(value);
      },
      writeHead: (code: number) => {
        statusCode = code;
      },
      end: (data?: any) => {
        if (data) payload = data;
      }
    };

    await this.handle(mockReq, mockRes);

    let result: any;
    try {
      result = JSON.parse(payload);
    } catch {
      result = payload;
    }

    return { statusCode, headers, payload, result };
  }

  private async handle(rawReq: any, rawRes: any): Promise<void> {
    try {
      const request = await this.createRequest(rawReq);
      const h = new ResponseToolkitImpl();

      // Run onRequest extensions
      await this.runExtensions('onRequest', request, h);

      // Parse body
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        await this.parsePayload(rawReq, request);
      }

      // Find route
      const match = this.router.find(request.method, request.path);

      if (!match) {
        this.send404(rawRes);
        return;
      }

      request.params = match.params;
      request.route = match.options;

      // Authentication
      const authConfig = match.options.options?.auth;
      if (authConfig !== false) {
        const strategyName = typeof authConfig === 'string'
          ? authConfig
          : authConfig?.strategy;

        await this.authManager.authenticate(request, strategyName);

        if (!request.auth?.isAuthenticated && authConfig) {
          rawRes.statusCode = 401;
          rawRes.setHeader('Content-Type', 'application/json');
          rawRes.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
      }

      // Validation
      if (match.options.options?.validate) {
        await this.validateRequest(request, match.options.options.validate);
      }

      // Execute handler
      let result = await match.handler(request, h);

      // Handle response
      if (result === CONTINUE) {
        result = null;
      }

      if (result instanceof ResponseImpl) {
        this.sendResponse(rawRes, result);
      } else {
        const response = h.response(result);
        this.sendResponse(rawRes, response as ResponseImpl);
      }

    } catch (err) {
      this.handleError(rawRes, err as Error);
    }
  }

  private async createRequest(rawReq: any): Promise<Request> {
    const url = new URL(rawReq.url || '/', 'http://localhost');

    const request: Request = {
      method: rawReq.method || 'GET',
      url,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      params: {},
      headers: rawReq.headers || {},
      info: {
        remoteAddress: rawReq.headers['x-forwarded-for'] || '127.0.0.1',
        host: rawReq.headers['host'] || 'localhost'
      },
      server: this,
      route: {} as RouteOptions
    };

    return request;
  }

  private async parsePayload(rawReq: any, request: Request): Promise<void> {
    return new Promise((resolve, reject) => {
      let data = '';

      rawReq.on('data', (chunk: any) => {
        data += chunk.toString();
      });

      rawReq.on('end', () => {
        try {
          const contentType = request.headers['content-type'] as string || '';

          if (contentType.includes('application/json')) {
            request.payload = data ? JSON.parse(data) : {};
          } else {
            request.payload = data;
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      rawReq.on('error', reject);
    });
  }

  private async validateRequest(request: Request, validate: any): Promise<void> {
    if (validate.params) {
      const result = this.validator.validate(validate.params, request.params);
      if (result.error) throw result.error;
    }

    if (validate.query) {
      const result = this.validator.validate(validate.query, request.query);
      if (result.error) throw result.error;
    }

    if (validate.payload) {
      const result = this.validator.validate(validate.payload, request.payload);
      if (result.error) throw result.error;
    }
  }

  private async runExtensions(event: string, request: Request, h: ResponseToolkit): Promise<void> {
    const extensions = this.extensions.get(event) || [];

    for (const ext of extensions) {
      await ext(request, h);
    }
  }

  private sendResponse(rawRes: any, response: ResponseImpl): void {
    rawRes.statusCode = response._statusCode;

    response._headers.forEach((value, name) => {
      rawRes.setHeader(name, value);
    });

    if (!response._headers.has('content-type')) {
      rawRes.setHeader('Content-Type', response._type);
    }

    if (response._value !== undefined && response._value !== null) {
      if (typeof response._value === 'object') {
        rawRes.end(JSON.stringify(response._value));
      } else {
        rawRes.end(String(response._value));
      }
    } else {
      rawRes.end();
    }
  }

  private send404(rawRes: any): void {
    rawRes.statusCode = 404;
    rawRes.setHeader('Content-Type', 'application/json');
    rawRes.end(JSON.stringify({
      statusCode: 404,
      error: 'Not Found',
      message: 'Not Found'
    }));
  }

  private handleError(rawRes: any, err: Error): void {
    console.error('Error:', err);

    const statusCode = (err as any).statusCode || 500;

    rawRes.statusCode = statusCode;
    rawRes.setHeader('Content-Type', 'application/json');
    rawRes.end(JSON.stringify({
      statusCode,
      error: err.name,
      message: err.message
    }));
  }
}

// ==================== FACTORY FUNCTION ====================

export function server(options: { port: number; host?: string; routes?: any }): Server {
  return new HapiServer(options);
}

export default { server };
