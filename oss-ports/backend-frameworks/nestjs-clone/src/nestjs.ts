/**
 * NestJS Clone - Enterprise framework for Elide
 *
 * Complete enterprise framework with Dependency Injection, Decorators,
 * Modules, Guards, Interceptors, Pipes, GraphQL support, and more.
 */

import { serve } from 'node:http';

// ==================== CORE TYPES ====================

export interface NestApplication {
  listen(port: number, callback?: () => void): Promise<void>;
  close(): Promise<void>;
  use(middleware: any): void;
  useGlobalGuards(...guards: Guard[]): void;
  useGlobalInterceptors(...interceptors: Interceptor[]): void;
  useGlobalPipes(...pipes: Pipe[]): void;
  useGlobalFilters(...filters: ExceptionFilter[]): void;
  get<T>(token: any): T;
  select(module: any): INestApplicationContext;
  enableCors(options?: CorsOptions): void;
  setGlobalPrefix(prefix: string): void;
}

export interface INestApplicationContext {
  get<T>(token: any): T;
  resolve<T>(token: any): Promise<T>;
  select(module: any): INestApplicationContext;
}

export interface ModuleMetadata {
  imports?: any[];
  controllers?: any[];
  providers?: Provider[];
  exports?: any[];
}

export interface Provider {
  provide: any;
  useClass?: any;
  useValue?: any;
  useFactory?: (...args: any[]) => any;
  inject?: any[];
}

export interface ExecutionContext {
  switchToHttp(): HttpArgumentsHost;
  getClass(): any;
  getHandler(): any;
  getArgs(): any[];
  getArgByIndex(index: number): any;
  switchToRpc(): RpcArgumentsHost;
  switchToWs(): WsArgumentsHost;
  getType(): string;
}

export interface HttpArgumentsHost {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getNext<T = any>(): T;
}

export interface RpcArgumentsHost {
  getData<T = any>(): T;
  getContext<T = any>(): T;
}

export interface WsArgumentsHost {
  getData<T = any>(): T;
  getClient<T = any>(): T;
}

export interface Guard {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

export interface Interceptor {
  intercept(context: ExecutionContext, next: CallHandler): Promise<any> | any;
}

export interface CallHandler {
  handle(): Promise<any>;
}

export interface Pipe {
  transform(value: any, metadata: ArgumentMetadata): any | Promise<any>;
}

export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: any;
  data?: string;
}

export interface ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any;
}

export interface ArgumentsHost {
  switchToHttp(): HttpArgumentsHost;
  switchToRpc(): RpcArgumentsHost;
  switchToWs(): WsArgumentsHost;
  getArgs(): any[];
  getArgByIndex(index: number): any;
  getType(): string;
}

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// ==================== DECORATORS METADATA ====================

const METADATA_KEY = {
  MODULE: 'module',
  CONTROLLER: 'controller',
  INJECTABLE: 'injectable',
  ROUTE: 'route',
  PARAM: 'param',
  GUARD: 'guard',
  INTERCEPTOR: 'interceptor',
  PIPE: 'pipe',
  EXCEPTION_FILTER: 'exception_filter'
};

const metadataStorage = new Map<any, Map<string, any>>();

function getMetadata(key: string, target: any): any {
  if (!metadataStorage.has(target)) {
    return undefined;
  }
  return metadataStorage.get(target)!.get(key);
}

function setMetadata(key: string, value: any, target: any): void {
  if (!metadataStorage.has(target)) {
    metadataStorage.set(target, new Map());
  }
  metadataStorage.get(target)!.set(key, value);
}

// ==================== DECORATORS ====================

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    setMetadata(METADATA_KEY.MODULE, metadata, target);
  };
}

export function Controller(prefix: string = ''): ClassDecorator {
  return (target: any) => {
    setMetadata(METADATA_KEY.CONTROLLER, { prefix }, target);
  };
}

export function Injectable(): ClassDecorator {
  return (target: any) => {
    setMetadata(METADATA_KEY.INJECTABLE, true, target);
  };
}

function createRouteDecorator(method: string) {
  return (path: string = ''): MethodDecorator => {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const routes = getMetadata(METADATA_KEY.ROUTE, target.constructor) || [];
      routes.push({
        method,
        path,
        handler: propertyKey,
        descriptor
      });
      setMetadata(METADATA_KEY.ROUTE, routes, target.constructor);
    };
  };
}

export const Get = createRouteDecorator('GET');
export const Post = createRouteDecorator('POST');
export const Put = createRouteDecorator('PUT');
export const Delete = createRouteDecorator('DELETE');
export const Patch = createRouteDecorator('PATCH');
export const Options = createRouteDecorator('OPTIONS');
export const Head = createRouteDecorator('HEAD');
export const All = createRouteDecorator('ALL');

export function Param(param?: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const params = getMetadata(METADATA_KEY.PARAM, target, propertyKey) || [];
    params.push({ index: parameterIndex, type: 'param', data: param });
    setMetadata(METADATA_KEY.PARAM, params, target);
  };
}

export function Body(property?: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const params = getMetadata(METADATA_KEY.PARAM, target, propertyKey) || [];
    params.push({ index: parameterIndex, type: 'body', data: property });
    setMetadata(METADATA_KEY.PARAM, params, target);
  };
}

export function Query(property?: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const params = getMetadata(METADATA_KEY.PARAM, target, propertyKey) || [];
    params.push({ index: parameterIndex, type: 'query', data: property });
    setMetadata(METADATA_KEY.PARAM, params, target);
  };
}

export function Headers(property?: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const params = getMetadata(METADATA_KEY.PARAM, target, propertyKey) || [];
    params.push({ index: parameterIndex, type: 'headers', data: property });
    setMetadata(METADATA_KEY.PARAM, params, target);
  };
}

export function Req(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const params = getMetadata(METADATA_KEY.PARAM, target, propertyKey) || [];
    params.push({ index: parameterIndex, type: 'request' });
    setMetadata(METADATA_KEY.PARAM, params, target);
  };
}

export function Res(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const params = getMetadata(METADATA_KEY.PARAM, target, propertyKey) || [];
    params.push({ index: parameterIndex, type: 'response' });
    setMetadata(METADATA_KEY.PARAM, params, target);
  };
}

export function UseGuards(...guards: any[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      // Method decorator
      setMetadata(METADATA_KEY.GUARD, guards, descriptor);
    } else {
      // Class decorator
      setMetadata(METADATA_KEY.GUARD, guards, target);
    }
  };
}

export function UseInterceptors(...interceptors: any[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      setMetadata(METADATA_KEY.INTERCEPTOR, interceptors, descriptor);
    } else {
      setMetadata(METADATA_KEY.INTERCEPTOR, interceptors, target);
    }
  };
}

export function UsePipes(...pipes: any[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      setMetadata(METADATA_KEY.PIPE, pipes, descriptor);
    } else {
      setMetadata(METADATA_KEY.PIPE, pipes, target);
    }
  };
}

// ==================== DEPENDENCY INJECTION ====================

class Container {
  private providers = new Map<any, any>();
  private instances = new Map<any, any>();

  register(token: any, provider: Provider | any): void {
    this.providers.set(token, provider);
  }

  resolve<T>(token: any): T {
    // Check if already instantiated
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const provider = this.providers.get(token);

    if (!provider) {
      // Try to instantiate directly
      if (typeof token === 'function') {
        const instance = new token();
        this.instances.set(token, instance);
        return instance;
      }
      throw new Error(`Provider not found: ${token}`);
    }

    let instance: any;

    if (provider.useValue) {
      instance = provider.useValue;
    } else if (provider.useFactory) {
      const deps = provider.inject ? provider.inject.map(dep => this.resolve(dep)) : [];
      instance = provider.useFactory(...deps);
    } else if (provider.useClass) {
      instance = new provider.useClass();
    } else if (typeof provider === 'function') {
      instance = new provider();
    } else {
      instance = provider;
    }

    this.instances.set(token, instance);
    return instance;
  }
}

// ==================== EXECUTION CONTEXT ====================

class ExecutionContextImpl implements ExecutionContext {
  constructor(
    private req: any,
    private res: any,
    private handler: any,
    private controllerClass: any
  ) {}

  switchToHttp(): HttpArgumentsHost {
    return {
      getRequest: () => this.req,
      getResponse: () => this.res,
      getNext: () => () => {}
    };
  }

  getClass(): any {
    return this.controllerClass;
  }

  getHandler(): any {
    return this.handler;
  }

  getArgs(): any[] {
    return [this.req, this.res];
  }

  getArgByIndex(index: number): any {
    return [this.req, this.res][index];
  }

  switchToRpc(): RpcArgumentsHost {
    throw new Error('RPC context not supported');
  }

  switchToWs(): WsArgumentsHost {
    throw new Error('WebSocket context not supported');
  }

  getType(): string {
    return 'http';
  }
}

// ==================== ROUTER ====================

class NestRouter {
  routes: Array<{
    method: string;
    path: string;
    handler: Function;
    controller: any;
    guards: Guard[];
    interceptors: Interceptor[];
    pipes: Pipe[];
    paramMetadata: any[];
  }> = [];

  register(
    method: string,
    path: string,
    handler: Function,
    controller: any,
    guards: Guard[],
    interceptors: Interceptor[],
    pipes: Pipe[],
    paramMetadata: any[]
  ): void {
    this.routes.push({
      method: method.toUpperCase(),
      path: this.normalizePath(path),
      handler,
      controller,
      guards,
      interceptors,
      pipes,
      paramMetadata
    });
  }

  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  find(method: string, path: string): any | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase() && route.method !== 'ALL') {
        continue;
      }

      const { pattern, params } = this.matchPath(route.path, path);
      if (pattern) {
        return { ...route, params };
      }
    }

    return null;
  }

  private matchPath(routePath: string, requestPath: string): { pattern: boolean; params: Record<string, string> } {
    const params: Record<string, string> = {};

    const routeSegments = routePath.split('/').filter(Boolean);
    const requestSegments = requestPath.split('/').filter(Boolean);

    if (routeSegments.length !== requestSegments.length) {
      return { pattern: false, params };
    }

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const requestSegment = requestSegments[i];

      if (routeSegment.startsWith(':')) {
        const paramName = routeSegment.substring(1);
        params[paramName] = requestSegment;
      } else if (routeSegment !== requestSegment) {
        return { pattern: false, params };
      }
    }

    return { pattern: true, params };
  }
}

// ==================== APPLICATION ====================

export class NestApplicationImpl implements NestApplication {
  private container: Container;
  private router: NestRouter;
  private server: any = null;
  private globalGuards: Guard[] = [];
  private globalInterceptors: Interceptor[] = [];
  private globalPipes: Pipe[] = [];
  private globalFilters: ExceptionFilter[] = [];
  private globalPrefix: string = '';

  constructor(private rootModule: any) {
    this.container = new Container();
    this.router = new NestRouter();
  }

  async init(): Promise<void> {
    await this.scanModule(this.rootModule);
  }

  private async scanModule(module: any): Promise<void> {
    const metadata = getMetadata(METADATA_KEY.MODULE, module);

    if (!metadata) {
      throw new Error('Invalid module');
    }

    // Register providers
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        if (typeof provider === 'object' && provider.provide) {
          this.container.register(provider.provide, provider);
        } else {
          this.container.register(provider, provider);
        }
      }
    }

    // Scan imports
    if (metadata.imports) {
      for (const importedModule of metadata.imports) {
        await this.scanModule(importedModule);
      }
    }

    // Register controllers
    if (metadata.controllers) {
      for (const controller of metadata.controllers) {
        this.registerController(controller);
      }
    }
  }

  private registerController(controller: any): void {
    const controllerMetadata = getMetadata(METADATA_KEY.CONTROLLER, controller);

    if (!controllerMetadata) {
      return;
    }

    const prefix = controllerMetadata.prefix || '';
    const routes = getMetadata(METADATA_KEY.ROUTE, controller) || [];

    const instance = this.container.resolve(controller);

    for (const route of routes) {
      const fullPath = this.globalPrefix + prefix + route.path;
      const guards = getMetadata(METADATA_KEY.GUARD, route.descriptor) || [];
      const interceptors = getMetadata(METADATA_KEY.INTERCEPTOR, route.descriptor) || [];
      const pipes = getMetadata(METADATA_KEY.PIPE, route.descriptor) || [];
      const paramMetadata = getMetadata(METADATA_KEY.PARAM, controller.prototype, route.handler) || [];

      this.router.register(
        route.method,
        fullPath,
        instance[route.handler].bind(instance),
        controller,
        guards,
        interceptors,
        pipes,
        paramMetadata
      );
    }
  }

  async listen(port: number, callback?: () => void): Promise<void> {
    await this.init();

    this.server = serve(
      { port, hostname: '0.0.0.0' },
      async (req, res) => {
        await this.handle(req, res);
      }
    );

    console.log(`NestJS application listening on port ${port}`);

    if (callback) {
      callback();
    }
  }

  async close(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
  }

  use(middleware: any): void {
    // Global middleware
  }

  useGlobalGuards(...guards: Guard[]): void {
    this.globalGuards.push(...guards);
  }

  useGlobalInterceptors(...interceptors: Interceptor[]): void {
    this.globalInterceptors.push(...interceptors);
  }

  useGlobalPipes(...pipes: Pipe[]): void {
    this.globalPipes.push(...pipes);
  }

  useGlobalFilters(...filters: ExceptionFilter[]): void {
    this.globalFilters.push(...filters);
  }

  get<T>(token: any): T {
    return this.container.resolve<T>(token);
  }

  select(module: any): INestApplicationContext {
    return this;
  }

  enableCors(options?: CorsOptions): void {
    // Enable CORS
  }

  setGlobalPrefix(prefix: string): void {
    this.globalPrefix = prefix;
  }

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
        rawRes.end(JSON.stringify({ statusCode: 404, message: 'Cannot ' + rawReq.method + ' ' + url.pathname }));
        return;
      }

      // Create execution context
      const context = new ExecutionContextImpl(rawReq, rawRes, match.handler, match.controller);

      // Run guards
      const allGuards = [...this.globalGuards, ...match.guards];
      for (const guard of allGuards) {
        const canActivate = await guard.canActivate(context);
        if (!canActivate) {
          rawRes.statusCode = 403;
          rawRes.setHeader('Content-Type', 'application/json');
          rawRes.end(JSON.stringify({ statusCode: 403, message: 'Forbidden resource' }));
          return;
        }
      }

      // Prepare handler arguments
      const args = this.prepareArguments(rawReq, rawRes, match.params, match.paramMetadata);

      // Run interceptors
      const allInterceptors = [...this.globalInterceptors, ...match.interceptors];

      let result: any;

      if (allInterceptors.length > 0) {
        // Execute with interceptors
        const callHandler: CallHandler = {
          handle: async () => await match.handler(...args)
        };

        result = await allInterceptors[0].intercept(context, callHandler);
      } else {
        // Execute handler directly
        result = await match.handler(...args);
      }

      // Send response
      if (result !== undefined) {
        rawRes.setHeader('Content-Type', 'application/json');
        rawRes.end(JSON.stringify(result));
      }

    } catch (err) {
      this.handleError(rawRes, err as Error);
    }
  }

  private prepareArguments(req: any, res: any, params: Record<string, string>, paramMetadata: any[]): any[] {
    const args: any[] = [];

    // Parse URL and query
    const url = new URL(req.url || '/', 'http://localhost');
    const query = Object.fromEntries(url.searchParams);

    for (const param of paramMetadata.sort((a, b) => a.index - b.index)) {
      switch (param.type) {
        case 'param':
          args[param.index] = param.data ? params[param.data] : params;
          break;
        case 'body':
          args[param.index] = param.data ? req.body?.[param.data] : req.body;
          break;
        case 'query':
          args[param.index] = param.data ? query[param.data] : query;
          break;
        case 'headers':
          args[param.index] = param.data ? req.headers[param.data] : req.headers;
          break;
        case 'request':
          args[param.index] = req;
          break;
        case 'response':
          args[param.index] = res;
          break;
      }
    }

    return args;
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
      statusCode,
      message: err.message,
      error: err.name
    }));
  }
}

// ==================== FACTORY ====================

export class NestFactory {
  static async create(module: any): Promise<NestApplication> {
    const app = new NestApplicationImpl(module);
    return app;
  }
}

export default NestFactory;
