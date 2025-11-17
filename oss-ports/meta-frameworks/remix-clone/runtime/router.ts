/**
 * Remix Router - File-based routing with loaders and actions
 *
 * Features:
 * - File-based routing from app/routes/
 * - Nested routes
 * - Dynamic segments ($param)
 * - Splat routes ($)
 * - Index routes
 * - Pathless layouts
 */

import { readdir } from 'fs/promises';
import { join, parse, relative } from 'path';

export interface RemixRoute {
  id: string;
  path: string;
  file: string;
  index?: boolean;
  caseSensitive?: boolean;
  parentId?: string;
  children?: RemixRoute[];
}

export class RemixRouter {
  private routes: RemixRoute[] = [];
  private routesDir: string;
  private routeMap = new Map<string, RemixRoute>();

  constructor(routesDir: string) {
    this.routesDir = routesDir;
  }

  /**
   * Build route tree
   */
  async build(): Promise<void> {
    console.log('[Router] Building routes...');
    const start = performance.now();

    const files = await this.scanDirectory(this.routesDir);
    this.routes = this.buildRouteTree(files);

    // Build route map
    this.buildRouteMap(this.routes);

    const elapsed = performance.now() - start;
    console.log(`[Router] Built ${this.routeMap.size} routes in ${elapsed.toFixed(2)}ms`);
  }

  /**
   * Scan directory for route files
   */
  private async scanDirectory(
    dir: string,
    basePath = ''
  ): Promise<Array<{ path: string; file: string }>> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: Array<{ path: string; file: string }> = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.scanDirectory(fullPath, relativePath);
        files.push(...subFiles);
      } else if (this.isRouteFile(entry.name)) {
        files.push({
          path: relativePath,
          file: fullPath,
        });
      }
    }

    return files;
  }

  /**
   * Check if file is a route file
   */
  private isRouteFile(filename: string): boolean {
    return /\.(tsx?|jsx?)$/.test(filename) && !filename.startsWith('.');
  }

  /**
   * Build route tree from files
   */
  private buildRouteTree(files: Array<{ path: string; file: string }>): RemixRoute[] {
    const routeMap = new Map<string, RemixRoute>();

    // Create routes
    for (const { path, file } of files) {
      const route = this.createRoute(path, file);
      routeMap.set(route.id, route);
    }

    // Build tree
    const roots: RemixRoute[] = [];

    for (const route of routeMap.values()) {
      if (route.parentId) {
        const parent = routeMap.get(route.parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(route);
        }
      } else {
        roots.push(route);
      }
    }

    return roots;
  }

  /**
   * Create route from file path
   */
  private createRoute(filePath: string, fullPath: string): RemixRoute {
    const parsed = parse(filePath);

    // Remove extension
    let routePath = filePath.replace(/\.(tsx?|jsx?)$/, '');

    // Determine route properties
    const isIndex = parsed.name === 'index';
    const segments = routePath.split('/').filter(Boolean);

    // Find parent
    let parentId: string | undefined;
    if (segments.length > 1) {
      const parentSegments = segments.slice(0, -1);
      parentId = parentSegments.join('/');
    }

    // Generate ID
    const id = routePath.replace(/\//g, '/');

    // Parse path
    let path = this.parseRoutePath(routePath);

    if (isIndex) {
      path = path.replace(/\/index$/, '') || '/';
    }

    return {
      id,
      path,
      file: fullPath,
      index: isIndex,
      parentId,
    };
  }

  /**
   * Parse route path
   */
  private parseRoutePath(path: string): string {
    return path
      // Splat routes: $.tsx -> *
      .replace(/\$/g, '*')
      // Dynamic segments: $param -> :param
      .replace(/\$(\w+)/g, ':$1')
      // Pathless layouts: __layout -> (empty)
      .replace(/__[\w]+/g, '');
  }

  /**
   * Build route map
   */
  private buildRouteMap(routes: RemixRoute[], map = this.routeMap): void {
    for (const route of routes) {
      map.set(route.id, route);
      if (route.children) {
        this.buildRouteMap(route.children, map);
      }
    }
  }

  /**
   * Match URL to route
   */
  match(pathname: string): RemixRoute | null {
    return this.matchRoute(pathname, this.routes);
  }

  /**
   * Match route recursively
   */
  private matchRoute(pathname: string, routes: RemixRoute[]): RemixRoute | null {
    for (const route of routes) {
      const regex = this.pathToRegex(route.path);
      const match = pathname.match(regex);

      if (match) {
        // Check children first
        if (route.children) {
          const childMatch = this.matchRoute(pathname, route.children);
          if (childMatch) {
            return childMatch;
          }
        }

        return route;
      }
    }

    return null;
  }

  /**
   * Convert path to regex
   */
  private pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:\w+/g, '([^/]+)')
      .replace(/\*/g, '(.*)');

    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract params from URL
   */
  extractParams(pathname: string, route: RemixRoute): Record<string, string> {
    const regex = this.pathToRegex(route.path);
    const match = pathname.match(regex);

    if (!match) {
      return {};
    }

    const paramNames = this.extractParamNames(route.path);
    const params: Record<string, string> = {};

    for (let i = 0; i < paramNames.length; i++) {
      params[paramNames[i]] = match[i + 1];
    }

    return params;
  }

  /**
   * Extract param names from path
   */
  private extractParamNames(path: string): string[] {
    const matches = path.matchAll(/:(\w+)/g);
    return Array.from(matches, m => m[1]);
  }

  /**
   * Get all routes
   */
  getRoutes(): RemixRoute[] {
    return this.routes;
  }

  /**
   * Get route by ID
   */
  getRoute(id: string): RemixRoute | undefined {
    return this.routeMap.get(id);
  }
}

export default RemixRouter;
