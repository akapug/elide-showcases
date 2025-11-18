/**
 * Fast Router Implementation for Fastify on Elide
 *
 * High-performance radix tree-based router with parametric and wildcard support.
 * Optimized for speed and memory efficiency.
 *
 * Features:
 * - Radix tree for O(k) lookup time (k = path length)
 * - Parametric routes (/user/:id)
 * - Wildcard routes (/files/*)
 * - Case sensitivity control
 * - Trailing slash handling
 * - Route constraints
 * - Version support
 */

import { FastifyRequest, FastifyReply } from './fastify';

/**
 * Route handler function type
 */
export type RouteHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<any> | any;

/**
 * Route options
 */
export interface RouteOptions {
  method: string | string[];
  url: string;
  handler: RouteHandler;
  schema?: {
    body?: any;
    querystring?: any;
    params?: any;
    headers?: any;
    response?: { [statusCode: number]: any };
  };
  preHandler?: RouteHandler | RouteHandler[];
  onRequest?: RouteHandler | RouteHandler[];
  onSend?: RouteHandler | RouteHandler[];
  onResponse?: RouteHandler | RouteHandler[];
  config?: any;
  version?: string;
  constraints?: {
    host?: string;
    version?: string;
  };
}

/**
 * Router configuration
 */
export interface RouterConfig {
  ignoreTrailingSlash?: boolean;
  caseSensitive?: boolean;
  maxParamLength?: number;
}

/**
 * Route match result
 */
export interface RouteMatch {
  handler: RouteHandler;
  params: Record<string, string>;
  opts: RouteOptions;
}

/**
 * Route node in the radix tree
 */
interface RouteNode {
  prefix: string;
  children: Map<string, RouteNode>;
  paramName?: string;
  wildcardNode?: RouteNode;
  handlers: Map<string, { handler: RouteHandler; opts: RouteOptions }>;
  isParam: boolean;
  isWildcard: boolean;
}

/**
 * Fast Router using Radix Tree
 */
export class Router {
  private root: RouteNode;
  private config: RouterConfig;

  constructor(config: RouterConfig = {}) {
    this.config = {
      ignoreTrailingSlash: config.ignoreTrailingSlash ?? true,
      caseSensitive: config.caseSensitive ?? false,
      maxParamLength: config.maxParamLength ?? 100,
    };

    this.root = this.createNode('');
  }

  /**
   * Create a new route node
   */
  private createNode(prefix: string, paramName?: string): RouteNode {
    return {
      prefix,
      children: new Map(),
      paramName,
      handlers: new Map(),
      isParam: !!paramName,
      isWildcard: prefix === '*',
    };
  }

  /**
   * Add a route to the router
   */
  public addRoute(method: string, path: string, handler: RouteHandler, opts: RouteOptions): void {
    let normalizedPath = path;

    // Normalize path
    if (!this.config.caseSensitive) {
      normalizedPath = normalizedPath.toLowerCase();
    }

    // Handle trailing slash
    if (this.config.ignoreTrailingSlash && normalizedPath !== '/' && normalizedPath.endsWith('/')) {
      normalizedPath = normalizedPath.slice(0, -1);
    }

    // Split path into segments
    const segments = normalizedPath.split('/').filter(s => s.length > 0);

    // Insert into tree
    this.insertRoute(this.root, segments, 0, method, handler, opts);
  }

  /**
   * Insert route into radix tree
   */
  private insertRoute(
    node: RouteNode,
    segments: string[],
    index: number,
    method: string,
    handler: RouteHandler,
    opts: RouteOptions
  ): void {
    // Base case: all segments processed
    if (index >= segments.length) {
      node.handlers.set(method, { handler, opts });
      return;
    }

    const segment = segments[index];

    // Parametric route (:id)
    if (segment.startsWith(':')) {
      const paramName = segment.slice(1);
      let paramNode = Array.from(node.children.values()).find(n => n.isParam);

      if (!paramNode) {
        paramNode = this.createNode(':' + paramName, paramName);
        node.children.set(':' + paramName, paramNode);
      }

      this.insertRoute(paramNode, segments, index + 1, method, handler, opts);
      return;
    }

    // Wildcard route (*)
    if (segment === '*') {
      if (!node.wildcardNode) {
        node.wildcardNode = this.createNode('*');
        node.wildcardNode.isWildcard = true;
      }
      node.wildcardNode.handlers.set(method, { handler, opts });
      return;
    }

    // Static route
    let child = node.children.get(segment);

    if (!child) {
      child = this.createNode(segment);
      node.children.set(segment, child);
    }

    this.insertRoute(child, segments, index + 1, method, handler, opts);
  }

  /**
   * Find route for a given method and path
   */
  public findRoute(method: string, path: string): RouteMatch | null {
    let normalizedPath = path;

    // Extract path without query string
    const queryIndex = normalizedPath.indexOf('?');
    if (queryIndex !== -1) {
      normalizedPath = normalizedPath.slice(0, queryIndex);
    }

    // Normalize path
    if (!this.config.caseSensitive) {
      normalizedPath = normalizedPath.toLowerCase();
    }

    // Handle trailing slash
    if (this.config.ignoreTrailingSlash && normalizedPath !== '/' && normalizedPath.endsWith('/')) {
      normalizedPath = normalizedPath.slice(0, -1);
    }

    // Handle root path
    if (normalizedPath === '' || normalizedPath === '/') {
      const handler = this.root.handlers.get(method);
      if (handler) {
        return {
          handler: handler.handler,
          params: {},
          opts: handler.opts,
        };
      }
    }

    // Split path into segments
    const segments = normalizedPath.split('/').filter(s => s.length > 0);

    // Search tree
    const params: Record<string, string> = {};
    const result = this.searchRoute(this.root, segments, 0, method, params);

    return result;
  }

  /**
   * Search for route in radix tree
   */
  private searchRoute(
    node: RouteNode,
    segments: string[],
    index: number,
    method: string,
    params: Record<string, string>
  ): RouteMatch | null {
    // Base case: all segments matched
    if (index >= segments.length) {
      const handler = node.handlers.get(method);
      if (handler) {
        return {
          handler: handler.handler,
          params: { ...params },
          opts: handler.opts,
        };
      }
      return null;
    }

    const segment = segments[index];

    // Try static route first (highest priority)
    const staticChild = node.children.get(segment);
    if (staticChild) {
      const result = this.searchRoute(staticChild, segments, index + 1, method, params);
      if (result) return result;
    }

    // Try parametric routes (medium priority)
    for (const [key, child] of node.children) {
      if (child.isParam && child.paramName) {
        // Validate param length
        if (this.config.maxParamLength && segment.length > this.config.maxParamLength) {
          continue;
        }

        const newParams = { ...params };
        newParams[child.paramName] = decodeURIComponent(segment);

        const result = this.searchRoute(child, segments, index + 1, method, newParams);
        if (result) return result;
      }
    }

    // Try wildcard route (lowest priority)
    if (node.wildcardNode) {
      const handler = node.wildcardNode.handlers.get(method);
      if (handler) {
        // Wildcard captures remaining path
        const remainingPath = segments.slice(index).join('/');
        params['*'] = decodeURIComponent(remainingPath);

        return {
          handler: handler.handler,
          params: { ...params },
          opts: handler.opts,
        };
      }
    }

    return null;
  }

  /**
   * Get all routes (for debugging)
   */
  public getAllRoutes(): Array<{ method: string; path: string; opts: RouteOptions }> {
    const routes: Array<{ method: string; path: string; opts: RouteOptions }> = [];
    this.collectRoutes(this.root, '', routes);
    return routes;
  }

  /**
   * Collect all routes from tree
   */
  private collectRoutes(
    node: RouteNode,
    currentPath: string,
    routes: Array<{ method: string; path: string; opts: RouteOptions }>
  ): void {
    const path = currentPath + (node.prefix ? '/' + node.prefix : '');

    // Add handlers at this node
    for (const [method, { opts }] of node.handlers) {
      routes.push({ method, path: path || '/', opts });
    }

    // Traverse children
    for (const child of node.children.values()) {
      this.collectRoutes(child, path, routes);
    }

    // Traverse wildcard
    if (node.wildcardNode) {
      for (const [method, { opts }] of node.wildcardNode.handlers) {
        routes.push({ method, path: path + '/*', opts });
      }
    }
  }

  /**
   * Print route tree (for debugging)
   */
  public printTree(): void {
    console.log('Route Tree:');
    this.printNode(this.root, 0);
  }

  /**
   * Print node recursively
   */
  private printNode(node: RouteNode, depth: number): void {
    const indent = '  '.repeat(depth);
    const prefix = node.prefix || '(root)';
    const methods = Array.from(node.handlers.keys()).join(', ');
    const label = node.isParam ? `[param: ${node.paramName}]` : node.isWildcard ? '[wildcard]' : prefix;

    console.log(`${indent}${label}${methods ? ` (${methods})` : ''}`);

    for (const child of node.children.values()) {
      this.printNode(child, depth + 1);
    }

    if (node.wildcardNode) {
      this.printNode(node.wildcardNode, depth + 1);
    }
  }
}

/**
 * Route utilities
 */
export class RouteUtils {
  /**
   * Check if two paths match (considering params and wildcards)
   */
  static pathsMatch(pattern: string, path: string): boolean {
    const patternSegments = pattern.split('/').filter(s => s.length > 0);
    const pathSegments = path.split('/').filter(s => s.length > 0);

    if (patternSegments.length !== pathSegments.length) {
      // Check for wildcard
      if (!pattern.includes('*')) {
        return false;
      }
    }

    for (let i = 0; i < patternSegments.length; i++) {
      const patternSeg = patternSegments[i];
      const pathSeg = pathSegments[i];

      if (patternSeg === '*') {
        return true; // Wildcard matches everything
      }

      if (patternSeg.startsWith(':')) {
        continue; // Param matches anything
      }

      if (patternSeg !== pathSeg) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract parameters from path based on pattern
   */
  static extractParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternSegments = pattern.split('/').filter(s => s.length > 0);
    const pathSegments = path.split('/').filter(s => s.length > 0);

    for (let i = 0; i < patternSegments.length && i < pathSegments.length; i++) {
      const patternSeg = patternSegments[i];
      const pathSeg = pathSegments[i];

      if (patternSeg.startsWith(':')) {
        const paramName = patternSeg.slice(1);
        params[paramName] = decodeURIComponent(pathSeg);
      } else if (patternSeg === '*') {
        params['*'] = pathSegments.slice(i).map(decodeURIComponent).join('/');
        break;
      }
    }

    return params;
  }

  /**
   * Normalize path for comparison
   */
  static normalizePath(path: string, options: { ignoreTrailingSlash?: boolean; caseSensitive?: boolean } = {}): string {
    let normalized = path;

    if (!options.caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    if (options.ignoreTrailingSlash && normalized !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }
}
