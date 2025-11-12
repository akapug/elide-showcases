/**
 * Spring Framework Compatibility Bridge
 *
 * Provides compatibility layer for Spring annotations and patterns,
 * allowing gradual migration from Spring to Elide.
 */

import 'reflect-metadata';

/**
 * Dependency injection container
 */
export class DependencyContainer {
  private static instance: DependencyContainer;
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  private singletons = new Map<string, boolean>();

  private constructor() {}

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Register a service
   */
  register<T>(name: string, factory: () => T, singleton = true): void {
    this.factories.set(name, factory);
    this.singletons.set(name, singleton);
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    if (this.singletons.get(name) && this.services.has(name)) {
      return this.services.get(name);
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service not found: ${name}`);
    }

    const instance = factory();

    if (this.singletons.get(name)) {
      this.services.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}

/**
 * Metadata keys for decorators
 */
const COMPONENT_METADATA = Symbol('component');
const AUTOWIRED_METADATA = Symbol('autowired');
const REQUEST_MAPPING_METADATA = Symbol('requestMapping');
const ROUTE_METADATA = Symbol('route');

/**
 * @Component decorator - marks a class as a Spring component
 */
export function Component(name?: string): ClassDecorator {
  return function (target: any) {
    const serviceName = name || target.name;
    Reflect.defineMetadata(COMPONENT_METADATA, serviceName, target);

    // Auto-register in container
    const container = DependencyContainer.getInstance();
    container.register(serviceName, () => new target(), true);

    return target;
  };
}

/**
 * @Service decorator - marks a class as a Spring service
 */
export function Service(name?: string): ClassDecorator {
  return Component(name);
}

/**
 * @Repository decorator - marks a class as a Spring repository
 */
export function Repository(name?: string): ClassDecorator {
  return Component(name);
}

/**
 * @RestController decorator - marks a class as a REST controller
 */
export function RestController(basePath?: string): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(REQUEST_MAPPING_METADATA, basePath || '', target);
    return Component(target.name)(target);
  };
}

/**
 * @Controller decorator - marks a class as a controller
 */
export function Controller(basePath?: string): ClassDecorator {
  return RestController(basePath);
}

/**
 * @Autowired decorator - injects dependencies
 */
export function Autowired(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    Reflect.defineMetadata(AUTOWIRED_METADATA, true, target, propertyKey);

    // Define property getter that resolves from container
    Object.defineProperty(target, propertyKey, {
      get() {
        const container = DependencyContainer.getInstance();
        const propertyType = Reflect.getMetadata('design:type', target, propertyKey);
        return container.get(propertyType.name);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Request mapping decorator factory
 */
function createMappingDecorator(method: string) {
  return function (path: string = ''): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
      const routes = Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];
      routes.push({
        method,
        path,
        handler: propertyKey,
        target: target.constructor,
      });
      Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);
      return descriptor;
    };
  };
}

/**
 * HTTP method decorators
 */
export const GetMapping = createMappingDecorator('GET');
export const PostMapping = createMappingDecorator('POST');
export const PutMapping = createMappingDecorator('PUT');
export const DeleteMapping = createMappingDecorator('DELETE');
export const PatchMapping = createMappingDecorator('PATCH');

/**
 * @RequestMapping decorator
 */
export function RequestMapping(path: string): ClassDecorator & MethodDecorator {
  return function (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    if (propertyKey && descriptor) {
      // Method decorator
      const routes = Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];
      routes.push({
        method: 'ALL',
        path,
        handler: propertyKey,
        target: target.constructor,
      });
      Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);
      return descriptor;
    } else {
      // Class decorator
      Reflect.defineMetadata(REQUEST_MAPPING_METADATA, path, target);
      return target;
    }
  };
}

/**
 * Parameter decorators
 */
export function PathVariable(name?: string): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingParams = Reflect.getMetadata('pathVariables', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, name });
    Reflect.defineMetadata('pathVariables', existingParams, target, propertyKey);
  };
}

export function RequestParam(name?: string): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingParams = Reflect.getMetadata('requestParams', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, name });
    Reflect.defineMetadata('requestParams', existingParams, target, propertyKey);
  };
}

export function RequestBody(): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    Reflect.defineMetadata('requestBody', parameterIndex, target, propertyKey);
  };
}

export function RequestHeader(name?: string): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingHeaders = Reflect.getMetadata('requestHeaders', target, propertyKey) || [];
    existingHeaders.push({ index: parameterIndex, name });
    Reflect.defineMetadata('requestHeaders', existingHeaders, target, propertyKey);
  };
}

/**
 * Response entity wrapper
 */
export class ResponseEntity<T> {
  constructor(
    public body: T,
    public status: number = 200,
    public headers: Record<string, string> = {}
  ) {}

  static ok<T>(body: T): ResponseEntity<T> {
    return new ResponseEntity(body, 200);
  }

  static created<T>(body: T): ResponseEntity<T> {
    return new ResponseEntity(body, 201);
  }

  static noContent(): ResponseEntity<void> {
    return new ResponseEntity(undefined as any, 204);
  }

  static badRequest<T>(body?: T): ResponseEntity<T> {
    return new ResponseEntity(body as T, 400);
  }

  static notFound<T>(body?: T): ResponseEntity<T> {
    return new ResponseEntity(body as T, 404);
  }

  static internalServerError<T>(body?: T): ResponseEntity<T> {
    return new ResponseEntity(body as T, 500);
  }

  static status(status: number) {
    return {
      body<T>(body: T): ResponseEntity<T> {
        return new ResponseEntity(body, status);
      },
    };
  }
}

/**
 * HTTP Status constants
 */
export class HttpStatus {
  static readonly OK = 200;
  static readonly CREATED = 201;
  static readonly NO_CONTENT = 204;
  static readonly BAD_REQUEST = 400;
  static readonly UNAUTHORIZED = 401;
  static readonly FORBIDDEN = 403;
  static readonly NOT_FOUND = 404;
  static readonly INTERNAL_SERVER_ERROR = 500;
}

/**
 * Route information
 */
export interface RouteInfo {
  method: string;
  path: string;
  handler: string | symbol;
  target: any;
}

/**
 * Spring Bridge Router - converts Spring routes to Elide handlers
 */
export class SpringBridgeRouter {
  private routes: RouteInfo[] = [];

  /**
   * Register a controller
   */
  registerController(controllerClass: any): void {
    const instance = new controllerClass();
    const basePath = Reflect.getMetadata(REQUEST_MAPPING_METADATA, controllerClass) || '';
    const routes = Reflect.getMetadata(ROUTE_METADATA, controllerClass) || [];

    for (const route of routes) {
      const fullPath = this.combinePaths(basePath, route.path);
      this.routes.push({
        method: route.method,
        path: fullPath,
        handler: route.handler,
        target: instance,
      });
    }
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RouteInfo[] {
    return this.routes;
  }

  /**
   * Convert to Elide handler format
   */
  toElideHandlers(): Array<{
    method: string;
    path: string;
    handler: Function;
  }> {
    return this.routes.map(route => ({
      method: route.method,
      path: route.path,
      handler: async (req: any) => {
        const target = route.target;
        const methodName = route.handler;
        const method = target[methodName];

        if (!method) {
          throw new Error(`Handler method not found: ${String(methodName)}`);
        }

        // Extract parameters
        const args = await this.extractMethodArguments(req, target, methodName);

        // Call method
        const result = await method.apply(target, args);

        // Convert response
        return this.convertResponse(result);
      },
    }));
  }

  /**
   * Extract method arguments from request
   */
  private async extractMethodArguments(req: any, target: any, methodName: string | symbol): Promise<any[]> {
    const args: any[] = [];

    // Path variables
    const pathVars = Reflect.getMetadata('pathVariables', target, methodName) || [];
    for (const param of pathVars) {
      args[param.index] = req.pathParams?.get(param.name);
    }

    // Request parameters
    const requestParams = Reflect.getMetadata('requestParams', target, methodName) || [];
    for (const param of requestParams) {
      args[param.index] = req.queryParams?.get(param.name);
    }

    // Request body
    const bodyIndex = Reflect.getMetadata('requestBody', target, methodName);
    if (bodyIndex !== undefined) {
      args[bodyIndex] = await req.json();
    }

    // Request headers
    const headers = Reflect.getMetadata('requestHeaders', target, methodName) || [];
    for (const header of headers) {
      args[header.index] = req.headers?.get(header.name);
    }

    return args;
  }

  /**
   * Convert response to Elide format
   */
  private convertResponse(result: any): any {
    if (result instanceof ResponseEntity) {
      return {
        status: result.status,
        body: JSON.stringify(result.body),
        headers: result.headers,
      };
    }

    // Default response
    return {
      status: 200,
      body: JSON.stringify(result),
    };
  }

  /**
   * Combine URL paths
   */
  private combinePaths(...paths: string[]): string {
    return paths
      .filter(p => p)
      .map(p => p.replace(/^\/+|\/+$/g, ''))
      .join('/')
      .replace(/^/, '/');
  }
}

/**
 * Configuration class decorator
 */
export function Configuration(): ClassDecorator {
  return Component();
}

/**
 * Bean method decorator
 */
export function Bean(name?: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const beanName = name || String(propertyKey);
    const originalMethod = descriptor.value;

    // Register bean factory
    const container = DependencyContainer.getInstance();
    container.register(beanName, () => {
      const instance = new target.constructor();
      return originalMethod.call(instance);
    }, true);

    return descriptor;
  };
}

/**
 * Value decorator for property injection
 */
export function Value(expression: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // Parse expression (simplified)
    const key = expression.replace(/\$\{([^}]+)\}/, '$1');
    const value = process.env[key] || '';

    Object.defineProperty(target, propertyKey, {
      value,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  };
}

/**
 * Transactional decorator (placeholder)
 */
export function Transactional(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      console.log(`[Transaction] Starting transaction for ${String(propertyKey)}`);
      try {
        const result = await originalMethod.apply(this, args);
        console.log(`[Transaction] Committing transaction for ${String(propertyKey)}`);
        return result;
      } catch (error) {
        console.log(`[Transaction] Rolling back transaction for ${String(propertyKey)}`);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Example usage and utilities
 */
export function createSpringApplication(controllers: any[]): SpringBridgeRouter {
  const router = new SpringBridgeRouter();

  for (const controller of controllers) {
    router.registerController(controller);
  }

  return router;
}

/**
 * Export commonly used types
 */
export type { RouteInfo };
