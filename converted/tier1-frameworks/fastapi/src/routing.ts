/**
 * FastAPI Routing Module
 *
 * Handles route definitions, path operations, and request routing.
 */

export interface RouteHandler {
  (request: any, dependencies?: any): Promise<any> | any;
}

export interface PathOperation {
  path: string;
  method: string;
  handler: RouteHandler;
  summary?: string;
  description?: string;
  tags?: string[];
  response_model?: any;
  status_code?: number;
  responses?: Record<number, any>;
  deprecated?: boolean;
  operation_id?: string;
  dependencies?: Record<string, any>;
  include_in_schema?: boolean;
}

export interface RouteDefinition extends PathOperation {}

/**
 * APIRouter class for organizing routes
 */
export class APIRouter {
  public routes: Map<string, Map<string, RouteDefinition>> = new Map();
  public prefix: string;
  public tags: string[];
  public dependencies: Record<string, any>;

  constructor(options: {
    prefix?: string;
    tags?: string[];
    dependencies?: Record<string, any>;
  } = {}) {
    this.prefix = options.prefix || '';
    this.tags = options.tags || [];
    this.dependencies = options.dependencies || {};
  }

  /**
   * Register a GET route
   */
  public get(path: string, handler: RouteHandler, options: Partial<PathOperation> = {}): this {
    return this.addRoute('GET', path, handler, options);
  }

  /**
   * Register a POST route
   */
  public post(path: string, handler: RouteHandler, options: Partial<PathOperation> = {}): this {
    return this.addRoute('POST', path, handler, options);
  }

  /**
   * Register a PUT route
   */
  public put(path: string, handler: RouteHandler, options: Partial<PathOperation> = {}): this {
    return this.addRoute('PUT', path, handler, options);
  }

  /**
   * Register a DELETE route
   */
  public delete(path: string, handler: RouteHandler, options: Partial<PathOperation> = {}): this {
    return this.addRoute('DELETE', path, handler, options);
  }

  /**
   * Register a PATCH route
   */
  public patch(path: string, handler: RouteHandler, options: Partial<PathOperation> = {}): this {
    return this.addRoute('PATCH', path, handler, options);
  }

  /**
   * Add a route to the router
   */
  private addRoute(
    method: string,
    path: string,
    handler: RouteHandler,
    options: Partial<PathOperation>
  ): this {
    const fullPath = this.prefix + path;

    if (!this.routes.has(fullPath)) {
      this.routes.set(fullPath, new Map());
    }

    const routeMap = this.routes.get(fullPath)!;

    // Merge router-level tags and dependencies
    const mergedTags = [...this.tags, ...(options.tags || [])];
    const mergedDeps = { ...this.dependencies, ...(options.dependencies || {}) };

    routeMap.set(method, {
      path: fullPath,
      method,
      handler,
      tags: mergedTags,
      dependencies: mergedDeps,
      ...options,
    });

    return this;
  }

  /**
   * Include another router
   */
  public include_router(router: APIRouter, prefix: string = '', tags: string[] = []): this {
    for (const [path, methods] of router.routes) {
      const fullPath = prefix + path;
      for (const [method, route] of methods) {
        const updatedRoute = { ...route };
        if (tags.length > 0) {
          updatedRoute.tags = [...(route.tags || []), ...tags];
        }
        this.addRoute(method, fullPath, route.handler, updatedRoute);
      }
    }
    return this;
  }
}

/**
 * Path parameter parser
 */
export class PathParser {
  /**
   * Parse path template to regex
   */
  static toRegex(path: string): RegExp {
    const pattern = path.replace(/\{(\w+)\}/g, '([^/]+)');
    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract parameter names from path
   */
  static getParamNames(path: string): string[] {
    const matches = path.match(/\{(\w+)\}/g);
    if (!matches) return [];
    return matches.map(m => m.slice(1, -1));
  }

  /**
   * Extract parameter values from path
   */
  static extractParams(template: string, path: string): Record<string, string> {
    const regex = this.toRegex(template);
    const paramNames = this.getParamNames(template);
    const match = path.match(regex);

    if (!match) return {};

    const params: Record<string, string> = {};
    paramNames.forEach((name, i) => {
      params[name] = match[i + 1];
    });

    return params;
  }
}

/**
 * Query parameter parser
 */
export class QueryParser {
  /**
   * Parse query string to object
   */
  static parse(queryString: string): Record<string, any> {
    const params = new URLSearchParams(queryString);
    const query: Record<string, any> = {};

    params.forEach((value, key) => {
      // Handle array parameters (key[]=value)
      if (key.endsWith('[]')) {
        const actualKey = key.slice(0, -2);
        if (!query[actualKey]) {
          query[actualKey] = [];
        }
        query[actualKey].push(value);
      } else {
        query[key] = value;
      }
    });

    return query;
  }

  /**
   * Validate and coerce query parameters
   */
  static validate(query: Record<string, any>, schema: any): Record<string, any> {
    // Simplified validation - in real implementation would use JSON Schema
    const validated: Record<string, any> = {};

    for (const [key, value] of Object.entries(query)) {
      if (schema[key]) {
        const type = schema[key].type;

        if (type === 'integer' || type === 'number') {
          validated[key] = Number(value);
        } else if (type === 'boolean') {
          validated[key] = value === 'true' || value === '1';
        } else if (type === 'array') {
          validated[key] = Array.isArray(value) ? value : [value];
        } else {
          validated[key] = value;
        }
      } else {
        validated[key] = value;
      }
    }

    return validated;
  }
}

export default APIRouter;
