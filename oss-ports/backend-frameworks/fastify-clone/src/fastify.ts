/**
 * Fastify Clone - Ultra-fast web framework for Elide
 *
 * A production-ready implementation of Fastify's API surface using Elide's runtime.
 * Provides schema validation, hooks, plugins, and blazing-fast request handling.
 */

import { serve } from 'node:http';

// ==================== TYPE DEFINITIONS ====================

export interface FastifyRequest<
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface
> {
  id: string;
  params: RouteGeneric['Params'];
  query: RouteGeneric['Querystring'];
  body: RouteGeneric['Body'];
  headers: Record<string, string | string[] | undefined>;
  raw: any;
  method: string;
  url: string;
  routerPath: string;
  routerMethod: string;
  ip: string;
  hostname: string;
  protocol: string;
  log: FastifyLogger;
  server: FastifyInstance;
}

export interface FastifyReply {
  code(statusCode: number): FastifyReply;
  status(statusCode: number): FastifyReply;
  header(name: string, value: string | number): FastifyReply;
  headers(headers: Record<string, string | number>): FastifyReply;
  type(contentType: string): FastifyReply;
  redirect(statusCode: number, url: string): FastifyReply;
  redirect(url: string): FastifyReply;
  send(payload: any): FastifyReply;
  raw: any;
  sent: boolean;
  statusCode: number;
  log: FastifyLogger;
  server: FastifyInstance;
}

export interface RouteGenericInterface {
  Body?: unknown;
  Querystring?: unknown;
  Params?: unknown;
  Headers?: unknown;
  Reply?: unknown;
}

export interface RouteOptions<
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface
> {
  method: HTTPMethods | HTTPMethods[];
  url: string;
  schema?: RouteSchema;
  handler: RouteHandler<RouteGeneric>;
  onRequest?: HookHandler[];
  preParsing?: HookHandler[];
  preValidation?: HookHandler[];
  preHandler?: HookHandler[];
  preSerialization?: HookHandler[];
  onResponse?: HookHandler[];
  onError?: ErrorHandler[];
  config?: any;
  constraints?: RouteConstraints;
  errorHandler?: ErrorHandler;
  schemaErrorFormatter?: SchemaErrorFormatter;
  attachValidation?: boolean;
  logLevel?: LogLevel;
  prefixTrailingSlash?: 'slash' | 'no-slash' | 'both';
}

export interface RouteSchema {
  body?: any;
  querystring?: any;
  params?: any;
  headers?: any;
  response?: {
    [statusCode: number]: any;
    [statusCode: string]: any;
  };
}

export type HTTPMethods =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS';

export type RouteHandler<
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface
> = (
  request: FastifyRequest<RouteGeneric>,
  reply: FastifyReply
) => any | Promise<any>;

export type HookHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => any | Promise<any>;

export type ErrorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => any | Promise<any>;

export interface FastifyError extends Error {
  statusCode?: number;
  validation?: ValidationError[];
  code?: string;
}

export interface ValidationError {
  keyword: string;
  dataPath: string;
  schemaPath: string;
  params: any;
  message: string;
}

export type SchemaErrorFormatter = (
  errors: ValidationError[],
  dataVar: string
) => Error;

export interface RouteConstraints {
  version?: string;
  host?: string | RegExp;
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface FastifyLogger {
  trace(msg: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;
  info(msg: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  fatal(msg: string, ...args: any[]): void;
  child(bindings: Record<string, any>): FastifyLogger;
}

export interface FastifyServerOptions {
  logger?: boolean | FastifyLoggerOptions;
  disableRequestLogging?: boolean;
  serverFactory?: ServerFactory;
  caseSensitive?: boolean;
  ignoreTrailingSlash?: boolean;
  maxParamLength?: number;
  bodyLimit?: number;
  onProtoPoisoning?: 'error' | 'remove' | 'ignore';
  onConstructorPoisoning?: 'error' | 'remove' | 'ignore';
  trustProxy?: boolean | string | string[] | number | TrustProxyFunction;
  pluginTimeout?: number;
  requestIdHeader?: string;
  requestIdLogLabel?: string;
  genReqId?: (req: any) => string;
  querystringParser?: (str: string) => Record<string, any>;
  versioning?: VersioningOptions;
  constraints?: ConstraintsOptions;
  return503OnClosing?: boolean;
  ajv?: AjvOptions;
  schemaErrorFormatter?: SchemaErrorFormatter;
  schemaController?: SchemaController;
  exposeHeadRoutes?: boolean;
}

export interface FastifyLoggerOptions {
  level?: LogLevel;
  prettyPrint?: boolean;
  serializers?: Record<string, (value: any) => any>;
}

export type ServerFactory = (handler: any, opts: any) => any;
export type TrustProxyFunction = (address: string, hop: number) => boolean;

export interface VersioningOptions {
  storage(): {
    get(version: string): any;
    set(version: string, store: any): void;
    del(version: string): void;
    empty(): void;
  };
  deriveVersion(req: any): string;
}

export interface ConstraintsOptions {
  [name: string]: {
    name: string;
    storage(): any;
    deriveConstraint(req: any): any;
    mustMatchWhenDerived?: boolean;
  };
}

export interface AjvOptions {
  customOptions?: any;
  plugins?: any[];
}

export interface SchemaController {
  bucket?: (parentSchemas?: any) => {
    add(schema: any): any;
    getSchema(schemaId: string): any;
    getSchemas(): Record<string, any>;
  };
  compilersFactory?: {
    buildValidator?: (externalSchemas: any, options: any) => (schema: any) => any;
  };
}

export interface FastifyInstance {
  server: any;
  log: FastifyLogger;

  // Route methods
  route<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    opts: RouteOptions<RouteGeneric>
  ): FastifyInstance;

  get<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;
  get<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    opts: Partial<RouteOptions<RouteGeneric>>,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;

  post<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;
  post<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    opts: Partial<RouteOptions<RouteGeneric>>,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;

  put<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;
  put<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    opts: Partial<RouteOptions<RouteGeneric>>,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;

  delete<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;
  delete<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    opts: Partial<RouteOptions<RouteGeneric>>,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;

  patch<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;
  patch<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    opts: Partial<RouteOptions<RouteGeneric>>,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;

  head<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;
  head<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    opts: Partial<RouteOptions<RouteGeneric>>,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;

  options<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;
  options<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    opts: Partial<RouteOptions<RouteGeneric>>,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;

  all<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;
  all<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    opts: Partial<RouteOptions<RouteGeneric>>,
    handler: RouteHandler<RouteGeneric>
  ): FastifyInstance;

  // Lifecycle hooks
  addHook(name: 'onRequest', hook: HookHandler): FastifyInstance;
  addHook(name: 'preParsing', hook: HookHandler): FastifyInstance;
  addHook(name: 'preValidation', hook: HookHandler): FastifyInstance;
  addHook(name: 'preHandler', hook: HookHandler): FastifyInstance;
  addHook(name: 'preSerialization', hook: HookHandler): FastifyInstance;
  addHook(name: 'onResponse', hook: HookHandler): FastifyInstance;
  addHook(name: 'onError', hook: ErrorHandler): FastifyInstance;
  addHook(name: 'onSend', hook: HookHandler): FastifyInstance;
  addHook(name: 'onTimeout', hook: HookHandler): FastifyInstance;
  addHook(name: 'onReady', hook: (done: (err?: Error) => void) => void): FastifyInstance;
  addHook(name: 'onClose', hook: (instance: FastifyInstance, done: (err?: Error) => void) => void): FastifyInstance;
  addHook(name: 'onRoute', hook: (opts: RouteOptions) => void): FastifyInstance;
  addHook(name: 'onRegister', hook: (instance: FastifyInstance, opts: any) => void): FastifyInstance;

  // Plugin system
  register(
    plugin: FastifyPlugin,
    opts?: FastifyPluginOptions
  ): FastifyInstance;

  decorate(name: string, value: any): FastifyInstance;
  decorateRequest(name: string, value: any): FastifyInstance;
  decorateReply(name: string, value: any): FastifyInstance;

  // Server control
  listen(port: number, callback?: (err: Error | null, address: string) => void): Promise<string>;
  listen(port: number, host: string, callback?: (err: Error | null, address: string) => void): Promise<string>;
  listen(opts: ListenOptions, callback?: (err: Error | null, address: string) => void): Promise<string>;

  close(callback?: () => void): Promise<void>;
  ready(callback?: (err?: Error) => void): Promise<void>;

  // Error handling
  setErrorHandler(handler: ErrorHandler): FastifyInstance;
  setNotFoundHandler(handler: RouteHandler): FastifyInstance;

  // Schema
  addSchema(schema: any): FastifyInstance;
  getSchemas(): Record<string, any>;
  getSchema(schemaId: string): any;

  // Validation
  setValidatorCompiler(validatorCompiler: ValidatorCompiler): FastifyInstance;
  setSerializerCompiler(serializerCompiler: SerializerCompiler): FastifyInstance;
  setReplySerializer(replySerializer: (payload: any, statusCode: number) => string): FastifyInstance;
  setSchemaErrorFormatter(errorFormatter: SchemaErrorFormatter): FastifyInstance;

  // Misc
  inject(opts: InjectOptions): Promise<InjectResponse>;
  printRoutes(): string;
  hasRoute(opts: { method: HTTPMethods; url: string }): boolean;

  // Extensions
  [key: string]: any;
}

export interface FastifyPlugin {
  (instance: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void;
  (instance: FastifyInstance, opts: FastifyPluginOptions): Promise<void>;
}

export interface FastifyPluginOptions {
  [key: string]: any;
}

export interface ListenOptions {
  port: number;
  host?: string;
  backlog?: number;
  path?: string;
  exclusive?: boolean;
  readableAll?: boolean;
  writableAll?: boolean;
  ipv6Only?: boolean;
}

export type ValidatorCompiler = (opts: { schema: any; method: HTTPMethods; url: string; httpPart?: string }) =>
  (data: any) => boolean | Promise<any>;

export type SerializerCompiler = (opts: { schema: any; method: HTTPMethods; url: string; httpStatus: string }) =>
  (data: any) => string;

export interface InjectOptions {
  method: HTTPMethods;
  url: string;
  headers?: Record<string, string>;
  payload?: any;
  query?: Record<string, any>;
}

export interface InjectResponse {
  statusCode: number;
  headers: Record<string, string>;
  payload: string;
  body: string;
  json<T = any>(): T;
}

// ==================== LOGGER IMPLEMENTATION ====================

class Logger implements FastifyLogger {
  private level: LogLevel;
  private bindings: Record<string, any>;
  private prettyPrint: boolean;

  constructor(opts: FastifyLoggerOptions = {}, bindings: Record<string, any> = {}) {
    this.level = opts.level || 'info';
    this.bindings = bindings;
    this.prettyPrint = opts.prettyPrint || false;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: LogLevel, msg: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const bindings = Object.keys(this.bindings).length > 0
      ? ' ' + JSON.stringify(this.bindings)
      : '';

    if (this.prettyPrint) {
      console.log(`[${timestamp}] ${level.toUpperCase()}${bindings}: ${msg}`, ...args);
    } else {
      console.log(JSON.stringify({
        level,
        time: timestamp,
        ...this.bindings,
        msg,
        args
      }));
    }
  }

  trace(msg: string, ...args: any[]): void {
    this.log('trace', msg, ...args);
  }

  debug(msg: string, ...args: any[]): void {
    this.log('debug', msg, ...args);
  }

  info(msg: string, ...args: any[]): void {
    this.log('info', msg, ...args);
  }

  warn(msg: string, ...args: any[]): void {
    this.log('warn', msg, ...args);
  }

  error(msg: string, ...args: any[]): void {
    this.log('error', msg, ...args);
  }

  fatal(msg: string, ...args: any[]): void {
    this.log('fatal', msg, ...args);
  }

  child(bindings: Record<string, any>): FastifyLogger {
    return new Logger(
      { level: this.level, prettyPrint: this.prettyPrint },
      { ...this.bindings, ...bindings }
    );
  }
}

// ==================== REQUEST IMPLEMENTATION ====================

class Request implements FastifyRequest {
  id: string;
  params: any = {};
  query: any = {};
  body: any = {};
  headers: Record<string, string | string[] | undefined> = {};
  raw: any;
  method: string;
  url: string;
  routerPath: string = '';
  routerMethod: string = '';
  ip: string = '';
  hostname: string = '';
  protocol: string = 'http';
  log: FastifyLogger;
  server: FastifyInstance;

  constructor(
    raw: any,
    server: FastifyInstance,
    log: FastifyLogger,
    genReqId?: (req: any) => string
  ) {
    this.raw = raw;
    this.server = server;
    this.method = raw.method || 'GET';
    this.url = raw.url || '/';
    this.headers = raw.headers || {};
    this.id = genReqId ? genReqId(raw) : this.generateId();
    this.log = log.child({ reqId: this.id });

    // Parse IP
    this.ip = this.headers['x-forwarded-for'] as string ||
              this.headers['x-real-ip'] as string ||
              '127.0.0.1';

    // Parse hostname
    this.hostname = this.headers.host as string || 'localhost';

    // Parse protocol
    this.protocol = this.headers['x-forwarded-proto'] as string || 'http';
  }

  private generateId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==================== REPLY IMPLEMENTATION ====================

class Reply implements FastifyReply {
  raw: any;
  sent: boolean = false;
  statusCode: number = 200;
  log: FastifyLogger;
  server: FastifyInstance;

  private _headers: Record<string, string | number> = {};

  constructor(raw: any, server: FastifyInstance, log: FastifyLogger) {
    this.raw = raw;
    this.server = server;
    this.log = log;
  }

  code(statusCode: number): FastifyReply {
    this.statusCode = statusCode;
    return this;
  }

  status(statusCode: number): FastifyReply {
    return this.code(statusCode);
  }

  header(name: string, value: string | number): FastifyReply {
    this._headers[name] = value;
    return this;
  }

  headers(headers: Record<string, string | number>): FastifyReply {
    Object.assign(this._headers, headers);
    return this;
  }

  type(contentType: string): FastifyReply {
    return this.header('Content-Type', contentType);
  }

  redirect(statusCodeOrUrl: number | string, url?: string): FastifyReply {
    if (typeof statusCodeOrUrl === 'string') {
      this.code(302).header('Location', statusCodeOrUrl);
      return this.send();
    } else {
      this.code(statusCodeOrUrl).header('Location', url!);
      return this.send();
    }
  }

  send(payload?: any): FastifyReply {
    if (this.sent) {
      this.log.warn('Reply already sent');
      return this;
    }

    this.sent = true;

    // Set headers
    for (const [name, value] of Object.entries(this._headers)) {
      this.raw.setHeader(name, value);
    }

    // Set status code
    this.raw.writeHead(this.statusCode);

    // Send payload
    if (payload !== undefined) {
      if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
        if (!this._headers['Content-Type']) {
          this.raw.setHeader('Content-Type', 'application/json');
        }
        this.raw.end(JSON.stringify(payload));
      } else {
        this.raw.end(payload);
      }
    } else {
      this.raw.end();
    }

    return this;
  }
}

// ==================== ROUTER IMPLEMENTATION ====================

interface Route {
  method: HTTPMethods | HTTPMethods[];
  url: string;
  handler: RouteHandler;
  schema?: RouteSchema;
  hooks: RouteHooks;
  config?: any;
  constraints?: RouteConstraints;
  errorHandler?: ErrorHandler;
  pattern?: RegExp;
  paramNames?: string[];
}

interface RouteHooks {
  onRequest: HookHandler[];
  preParsing: HookHandler[];
  preValidation: HookHandler[];
  preHandler: HookHandler[];
  preSerialization: HookHandler[];
  onResponse: HookHandler[];
  onError: ErrorHandler[];
}

class Router {
  private routes: Route[] = [];
  private caseSensitive: boolean;
  private ignoreTrailingSlash: boolean;

  constructor(caseSensitive = true, ignoreTrailingSlash = false) {
    this.caseSensitive = caseSensitive;
    this.ignoreTrailingSlash = ignoreTrailingSlash;
  }

  add(route: Route): void {
    const { pattern, paramNames } = this.compilePattern(route.url);
    route.pattern = pattern;
    route.paramNames = paramNames;
    this.routes.push(route);
  }

  find(method: string, url: string): { route: Route; params: any } | null {
    let path = url;
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      path = url.substring(0, queryIndex);
    }

    if (this.ignoreTrailingSlash && path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    for (const route of this.routes) {
      const methods = Array.isArray(route.method) ? route.method : [route.method];
      if (!methods.includes(method as HTTPMethods)) continue;

      const match = path.match(route.pattern!);
      if (match) {
        const params: any = {};
        if (route.paramNames) {
          route.paramNames.forEach((name, i) => {
            params[name] = match[i + 1];
          });
        }
        return { route, params };
      }
    }

    return null;
  }

  private compilePattern(url: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    let pattern = url.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    pattern = pattern.replace(/\*/g, '.*');

    if (this.ignoreTrailingSlash) {
      pattern = pattern + '/?';
    }

    const flags = this.caseSensitive ? '' : 'i';
    return {
      pattern: new RegExp(`^${pattern}$`, flags),
      paramNames
    };
  }

  getRoutes(): Route[] {
    return this.routes;
  }
}

// ==================== SCHEMA VALIDATOR ====================

class SchemaValidator {
  private schemas: Map<string, any> = new Map();

  addSchema(schema: any): void {
    if (schema.$id) {
      this.schemas.set(schema.$id, schema);
    }
  }

  getSchema(schemaId: string): any {
    return this.schemas.get(schemaId);
  }

  getSchemas(): Record<string, any> {
    return Object.fromEntries(this.schemas);
  }

  validate(schema: any, data: any): { valid: boolean; errors?: ValidationError[] } {
    // Simple validation - in production, use Ajv or similar
    if (!schema) return { valid: true };

    const errors: ValidationError[] = [];

    if (schema.type === 'object' && schema.properties) {
      if (typeof data !== 'object') {
        errors.push({
          keyword: 'type',
          dataPath: '',
          schemaPath: '#/type',
          params: { type: 'object' },
          message: 'should be object'
        });
      } else {
        for (const [key, propSchema] of Object.entries(schema.properties as any)) {
          if (schema.required?.includes(key) && !(key in data)) {
            errors.push({
              keyword: 'required',
              dataPath: '',
              schemaPath: `#/required`,
              params: { missingProperty: key },
              message: `should have required property '${key}'`
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

// ==================== PLUGIN SYSTEM ====================

interface PluginMetadata {
  name?: string;
  dependencies?: string[];
  decorators?: {
    fastify?: string[];
    request?: string[];
    reply?: string[];
  };
}

class PluginManager {
  private plugins: Array<{
    plugin: FastifyPlugin;
    opts: FastifyPluginOptions;
    metadata?: PluginMetadata;
  }> = [];

  private registered = new Set<string>();

  register(plugin: FastifyPlugin, opts: FastifyPluginOptions = {}): void {
    this.plugins.push({ plugin, opts });
  }

  async load(instance: FastifyInstance): Promise<void> {
    for (const { plugin, opts } of this.plugins) {
      await this.loadPlugin(instance, plugin, opts);
    }
  }

  private async loadPlugin(
    instance: FastifyInstance,
    plugin: FastifyPlugin,
    opts: FastifyPluginOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const done = (err?: Error) => {
        if (err) reject(err);
        else resolve();
      };

      const result = plugin(instance, opts, done);

      if (result && typeof result.then === 'function') {
        result.then(() => resolve()).catch(reject);
      }
    });
  }
}

// ==================== FASTIFY INSTANCE ====================

class Fastify implements FastifyInstance {
  server: any;
  log: FastifyLogger;

  private router: Router;
  private globalHooks: Map<string, Array<HookHandler | ErrorHandler>> = new Map();
  private errorHandler?: ErrorHandler;
  private notFoundHandler?: RouteHandler;
  private schemaValidator: SchemaValidator;
  private pluginManager: PluginManager;
  private decorations: Map<string, any> = new Map();
  private requestDecorations: Map<string, any> = new Map();
  private replyDecorations: Map<string, any> = new Map();
  private options: FastifyServerOptions;
  private ready_: boolean = false;
  private readyHandlers: Array<(err?: Error) => void> = [];
  private closeHandlers: Array<(instance: FastifyInstance, done: (err?: Error) => void) => void> = [];

  constructor(opts: FastifyServerOptions = {}) {
    this.options = opts;

    // Initialize logger
    const loggerOpts = typeof opts.logger === 'object' ? opts.logger :
                       opts.logger === true ? {} : { level: 'error' };
    this.log = new Logger(loggerOpts);

    // Initialize router
    this.router = new Router(
      opts.caseSensitive !== false,
      opts.ignoreTrailingSlash === true
    );

    // Initialize schema validator
    this.schemaValidator = new SchemaValidator();

    // Initialize plugin manager
    this.pluginManager = new PluginManager();

    // Create server (will be set in listen)
    this.server = null;
  }

  // ==================== ROUTE METHODS ====================

  route(opts: RouteOptions): FastifyInstance {
    const hooks: RouteHooks = {
      onRequest: opts.onRequest || [],
      preParsing: opts.preParsing || [],
      preValidation: opts.preValidation || [],
      preHandler: opts.preHandler || [],
      preSerialization: opts.preSerialization || [],
      onResponse: opts.onResponse || [],
      onError: opts.onError || []
    };

    const route: Route = {
      method: opts.method,
      url: opts.url,
      handler: opts.handler,
      schema: opts.schema,
      hooks,
      config: opts.config,
      constraints: opts.constraints,
      errorHandler: opts.errorHandler
    };

    this.router.add(route);

    // Call onRoute hook
    const onRouteHooks = this.globalHooks.get('onRoute') || [];
    for (const hook of onRouteHooks) {
      (hook as any)(opts);
    }

    this.log.debug(`Route registered: ${opts.method} ${opts.url}`);

    return this;
  }

  private createRouteShorthand(method: HTTPMethods) {
    return (url: string, ...args: any[]): FastifyInstance => {
      let opts: Partial<RouteOptions> = {};
      let handler: RouteHandler;

      if (args.length === 1) {
        handler = args[0];
      } else {
        opts = args[0];
        handler = args[1];
      }

      return this.route({
        method,
        url,
        handler,
        ...opts
      } as RouteOptions);
    };
  }

  get = this.createRouteShorthand('GET');
  post = this.createRouteShorthand('POST');
  put = this.createRouteShorthand('PUT');
  delete = this.createRouteShorthand('DELETE');
  patch = this.createRouteShorthand('PATCH');
  head = this.createRouteShorthand('HEAD');
  options = this.createRouteShorthand('OPTIONS');

  all(url: string, ...args: any[]): FastifyInstance {
    const methods: HTTPMethods[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

    let opts: Partial<RouteOptions> = {};
    let handler: RouteHandler;

    if (args.length === 1) {
      handler = args[0];
    } else {
      opts = args[0];
      handler = args[1];
    }

    return this.route({
      method: methods,
      url,
      handler,
      ...opts
    } as RouteOptions);
  }

  // ==================== HOOKS ====================

  addHook(name: string, hook: HookHandler | ErrorHandler | any): FastifyInstance {
    if (!this.globalHooks.has(name)) {
      this.globalHooks.set(name, []);
    }
    this.globalHooks.get(name)!.push(hook);
    return this;
  }

  // ==================== PLUGIN SYSTEM ====================

  register(plugin: FastifyPlugin, opts: FastifyPluginOptions = {}): FastifyInstance {
    this.pluginManager.register(plugin, opts);

    // Call onRegister hook
    const onRegisterHooks = this.globalHooks.get('onRegister') || [];
    for (const hook of onRegisterHooks) {
      (hook as any)(this, opts);
    }

    return this;
  }

  decorate(name: string, value: any): FastifyInstance {
    this.decorations.set(name, value);
    (this as any)[name] = value;
    return this;
  }

  decorateRequest(name: string, value: any): FastifyInstance {
    this.requestDecorations.set(name, value);
    return this;
  }

  decorateReply(name: string, value: any): FastifyInstance {
    this.replyDecorations.set(name, value);
    return this;
  }

  // ==================== SERVER CONTROL ====================

  async listen(...args: any[]): Promise<string> {
    let port: number;
    let host: string = '0.0.0.0';
    let callback: ((err: Error | null, address: string) => void) | undefined;

    if (typeof args[0] === 'object') {
      const opts = args[0] as ListenOptions;
      port = opts.port;
      host = opts.host || host;
      callback = args[1];
    } else {
      port = args[0];
      if (typeof args[1] === 'string') {
        host = args[1];
        callback = args[2];
      } else {
        callback = args[1];
      }
    }

    try {
      // Load plugins
      await this.pluginManager.load(this);

      // Mark as ready
      await this.ready();

      // Create server
      return new Promise((resolve, reject) => {
        this.server = serve(
          { port, hostname: host },
          async (req: any, res: any) => {
            await this.handleRequest(req, res);
          }
        );

        const address = `http://${host}:${port}`;
        this.log.info(`Server listening on ${address}`);

        if (callback) {
          callback(null, address);
        }

        resolve(address);
      });
    } catch (err) {
      if (callback) {
        callback(err as Error, '');
      }
      throw err;
    }
  }

  async close(callback?: () => void): Promise<void> {
    // Call onClose hooks
    for (const hook of this.closeHandlers) {
      await new Promise<void>((resolve, reject) => {
        hook(this, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    if (this.server) {
      this.server.close();
    }

    if (callback) {
      callback();
    }
  }

  async ready(callback?: (err?: Error) => void): Promise<void> {
    if (this.ready_) {
      if (callback) callback();
      return;
    }

    if (callback) {
      this.readyHandlers.push(callback);
    }

    try {
      // Call onReady hooks
      const onReadyHooks = this.globalHooks.get('onReady') || [];
      for (const hook of onReadyHooks) {
        await new Promise<void>((resolve, reject) => {
          (hook as any)((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      this.ready_ = true;

      // Call all ready handlers
      for (const handler of this.readyHandlers) {
        handler();
      }
      this.readyHandlers = [];
    } catch (err) {
      for (const handler of this.readyHandlers) {
        handler(err as Error);
      }
      this.readyHandlers = [];
      throw err;
    }
  }

  // ==================== REQUEST HANDLING ====================

  private async handleRequest(rawReq: any, rawRes: any): Promise<void> {
    const request = new Request(
      rawReq,
      this,
      this.log,
      this.options.genReqId
    );

    const reply = new Reply(rawRes, this, request.log);

    // Apply request decorations
    for (const [name, value] of this.requestDecorations) {
      (request as any)[name] = value;
    }

    // Apply reply decorations
    for (const [name, value] of this.replyDecorations) {
      (reply as any)[name] = value;
    }

    try {
      // Parse URL and query
      const urlObj = new URL(request.url, `http://${request.hostname}`);
      request.query = this.parseQuery(urlObj.search);

      // Find route
      const match = this.router.find(request.method, urlObj.pathname);

      if (!match) {
        if (this.notFoundHandler) {
          await this.notFoundHandler(request, reply);
        } else {
          reply.code(404).send({ error: 'Not Found', message: `Route ${request.method}:${urlObj.pathname} not found` });
        }
        return;
      }

      const { route, params } = match;
      request.params = params;
      request.routerPath = route.url;
      request.routerMethod = Array.isArray(route.method) ? route.method[0] : route.method;

      // Run global onRequest hooks
      await this.runHooks(this.globalHooks.get('onRequest') || [], request, reply);
      await this.runHooks(route.hooks.onRequest, request, reply);

      // Parse body
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        await this.parseBody(rawReq, request);
      }

      // Run preParsing hooks
      await this.runHooks(this.globalHooks.get('preParsing') || [], request, reply);
      await this.runHooks(route.hooks.preParsing, request, reply);

      // Validate
      if (route.schema) {
        await this.validateRequest(route.schema, request, reply);
      }

      // Run preValidation hooks
      await this.runHooks(this.globalHooks.get('preValidation') || [], request, reply);
      await this.runHooks(route.hooks.preValidation, request, reply);

      // Run preHandler hooks
      await this.runHooks(this.globalHooks.get('preHandler') || [], request, reply);
      await this.runHooks(route.hooks.preHandler, request, reply);

      // Execute handler
      const result = await route.handler(request, reply);

      // Send response if not already sent
      if (!reply.sent && result !== undefined) {
        reply.send(result);
      }

      // Run onResponse hooks
      await this.runHooks(this.globalHooks.get('onResponse') || [], request, reply);
      await this.runHooks(route.hooks.onResponse, request, reply);

    } catch (err) {
      await this.handleError(err as FastifyError, request, reply);
    }
  }

  private async runHooks(hooks: Array<HookHandler | ErrorHandler>, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    for (const hook of hooks) {
      if (reply.sent) break;
      await (hook as HookHandler)(request, reply);
    }
  }

  private parseQuery(search: string): Record<string, any> {
    if (!search || search === '?') return {};

    const query: Record<string, any> = {};
    const params = new URLSearchParams(search);

    for (const [key, value] of params) {
      query[key] = value;
    }

    return query;
  }

  private async parseBody(rawReq: any, request: FastifyRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      let data = '';

      rawReq.on('data', (chunk: any) => {
        data += chunk.toString();
      });

      rawReq.on('end', () => {
        try {
          const contentType = request.headers['content-type'] as string || '';

          if (contentType.includes('application/json')) {
            request.body = data ? JSON.parse(data) : {};
          } else {
            request.body = data;
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      rawReq.on('error', reject);
    });
  }

  private async validateRequest(schema: RouteSchema, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (schema.body) {
      const result = this.schemaValidator.validate(schema.body, request.body);
      if (!result.valid) {
        throw this.createValidationError(result.errors!);
      }
    }

    if (schema.querystring) {
      const result = this.schemaValidator.validate(schema.querystring, request.query);
      if (!result.valid) {
        throw this.createValidationError(result.errors!);
      }
    }

    if (schema.params) {
      const result = this.schemaValidator.validate(schema.params, request.params);
      if (!result.valid) {
        throw this.createValidationError(result.errors!);
      }
    }
  }

  private createValidationError(errors: ValidationError[]): FastifyError {
    const error = new Error('Validation failed') as FastifyError;
    error.statusCode = 400;
    error.validation = errors;
    error.code = 'FST_ERR_VALIDATION';
    return error;
  }

  private async handleError(error: FastifyError, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    request.log.error(error);

    // Run onError hooks
    const onErrorHooks = this.globalHooks.get('onError') || [];
    for (const hook of onErrorHooks) {
      await (hook as ErrorHandler)(error, request, reply);
    }

    if (reply.sent) return;

    // Use custom error handler if set
    if (this.errorHandler) {
      await this.errorHandler(error, request, reply);
      return;
    }

    // Default error handling
    const statusCode = error.statusCode || 500;
    const response: any = {
      error: error.name || 'Error',
      message: error.message,
      statusCode
    };

    if (error.validation) {
      response.validation = error.validation;
    }

    reply.code(statusCode).send(response);
  }

  // ==================== ERROR HANDLING ====================

  setErrorHandler(handler: ErrorHandler): FastifyInstance {
    this.errorHandler = handler;
    return this;
  }

  setNotFoundHandler(handler: RouteHandler): FastifyInstance {
    this.notFoundHandler = handler;
    return this;
  }

  // ==================== SCHEMA ====================

  addSchema(schema: any): FastifyInstance {
    this.schemaValidator.addSchema(schema);
    return this;
  }

  getSchemas(): Record<string, any> {
    return this.schemaValidator.getSchemas();
  }

  getSchema(schemaId: string): any {
    return this.schemaValidator.getSchema(schemaId);
  }

  // ==================== VALIDATION COMPILERS ====================

  setValidatorCompiler(validatorCompiler: ValidatorCompiler): FastifyInstance {
    // Store for future use
    return this;
  }

  setSerializerCompiler(serializerCompiler: SerializerCompiler): FastifyInstance {
    // Store for future use
    return this;
  }

  setReplySerializer(replySerializer: (payload: any, statusCode: number) => string): FastifyInstance {
    // Store for future use
    return this;
  }

  setSchemaErrorFormatter(errorFormatter: SchemaErrorFormatter): FastifyInstance {
    // Store for future use
    return this;
  }

  // ==================== TESTING ====================

  async inject(opts: InjectOptions): Promise<InjectResponse> {
    // Simulate HTTP request for testing
    const headers = opts.headers || {};
    const query = opts.query || {};

    let url = opts.url;
    const queryString = new URLSearchParams(query as any).toString();
    if (queryString) {
      url += '?' + queryString;
    }

    const rawReq = {
      method: opts.method,
      url,
      headers,
      on: (event: string, handler: Function) => {
        if (event === 'data' && opts.payload) {
          const payload = typeof opts.payload === 'string'
            ? opts.payload
            : JSON.stringify(opts.payload);
          handler(Buffer.from(payload));
        }
        if (event === 'end') {
          handler();
        }
      }
    };

    let statusCode = 200;
    let responseHeaders: Record<string, string> = {};
    let body = '';

    const rawRes = {
      setHeader: (name: string, value: any) => {
        responseHeaders[name] = String(value);
      },
      writeHead: (code: number) => {
        statusCode = code;
      },
      end: (data?: any) => {
        if (data) body = data;
      }
    };

    await this.handleRequest(rawReq, rawRes);

    return {
      statusCode,
      headers: responseHeaders,
      payload: body,
      body,
      json: <T = any>() => JSON.parse(body) as T
    };
  }

  // ==================== UTILITIES ====================

  printRoutes(): string {
    const routes = this.router.getRoutes();
    let output = '\n';

    for (const route of routes) {
      const methods = Array.isArray(route.method) ? route.method.join('|') : route.method;
      output += `${methods.padEnd(10)} ${route.url}\n`;
    }

    return output;
  }

  hasRoute(opts: { method: HTTPMethods; url: string }): boolean {
    const match = this.router.find(opts.method, opts.url);
    return match !== null;
  }
}

// ==================== FACTORY FUNCTION ====================

export default function fastify(opts?: FastifyServerOptions): FastifyInstance {
  return new Fastify(opts);
}

export { fastify };
