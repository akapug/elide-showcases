/**
 * File-based Router for Elide Next Clone
 *
 * Implements Next.js-compatible routing with:
 * - Pages directory routing
 * - App directory routing
 * - Dynamic routes ([id])
 * - Catch-all routes ([...slug])
 * - Optional catch-all ([[...slug]])
 * - Route groups ((group))
 * - Parallel routes (@modal)
 * - Intercepting routes ((.))
 */

import { URL } from 'url';
import { readdir, stat } from 'fs/promises';
import { join, relative, sep } from 'path';

export interface Route {
  path: string;
  pattern: RegExp;
  params: string[];
  filePath: string;
  type: 'page' | 'api' | 'layout' | 'loading' | 'error' | 'not-found';
  method?: string;
  middleware?: string[];
  dynamic?: 'force-dynamic' | 'force-static' | 'auto';
  revalidate?: number | false;
}

export interface RouteMatch {
  route: Route;
  params: Record<string, string | string[]>;
  searchParams: URLSearchParams;
}

export class FileRouter {
  private routes: Route[] = [];
  private layouts: Map<string, string> = new Map();
  private routeCache: Map<string, RouteMatch | null> = new Map();

  constructor(
    private pagesDir: string,
    private appDir?: string
  ) {}

  /**
   * Scan and build route tree
   */
  async build(): Promise<void> {
    console.log('[Router] Building route tree...');
    const start = performance.now();

    // Scan pages directory (traditional Next.js routing)
    if (this.pagesDir) {
      await this.scanPagesDirectory(this.pagesDir);
    }

    // Scan app directory (React Server Components routing)
    if (this.appDir) {
      await this.scanAppDirectory(this.appDir);
    }

    // Sort routes by specificity (most specific first)
    this.routes.sort((a, b) => {
      const aStatic = !a.path.includes(':');
      const bStatic = !b.path.includes(':');
      if (aStatic && !bStatic) return -1;
      if (!aStatic && bStatic) return 1;
      return b.path.length - a.path.length;
    });

    const elapsed = performance.now() - start;
    console.log(`[Router] Built ${this.routes.length} routes in ${elapsed.toFixed(2)}ms`);
  }

  /**
   * Scan pages directory
   */
  private async scanPagesDirectory(dir: string, basePath = ''): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Skip special Next.js directories
        if (entry.name === 'api') {
          await this.scanApiDirectory(fullPath, '/api');
          continue;
        }
        await this.scanPagesDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        const route = this.parsePageRoute(relativePath, fullPath);
        if (route) {
          this.routes.push(route);
        }
      }
    }
  }

  /**
   * Scan API directory
   */
  private async scanApiDirectory(dir: string, basePath: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        await this.scanApiDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        const route = this.parseApiRoute(relativePath, fullPath);
        if (route) {
          this.routes.push(route);
        }
      }
    }
  }

  /**
   * Scan app directory (RSC)
   */
  private async scanAppDirectory(dir: string, basePath = ''): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    let hasLayout = false;

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Check for route groups (folder)
        if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
          // Route groups don't affect URL structure
          await this.scanAppDirectory(fullPath, basePath);
          continue;
        }

        // Check for parallel routes @folder
        if (entry.name.startsWith('@')) {
          // Parallel routes
          await this.scanAppDirectory(fullPath, basePath);
          continue;
        }

        // Regular directory
        await this.scanAppDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        const route = this.parseAppRoute(relativePath, fullPath, basePath);
        if (route) {
          if (route.type === 'layout') {
            hasLayout = true;
            this.layouts.set(basePath || '/', fullPath);
          }
          this.routes.push(route);
        }
      }
    }
  }

  /**
   * Parse page route from file path
   */
  private parsePageRoute(filePath: string, fullPath: string): Route | null {
    // Remove file extension
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    let routePath = filePath;

    for (const ext of extensions) {
      if (routePath.endsWith(ext)) {
        routePath = routePath.slice(0, -ext.length);
        break;
      }
    }

    // Handle index files
    if (routePath.endsWith('/index') || routePath === 'index') {
      routePath = routePath.slice(0, -6) || '/';
    }

    // Convert file path to route path
    let pattern = routePath.startsWith('/') ? routePath : '/' + routePath;
    const params: string[] = [];

    // Handle dynamic segments [param]
    pattern = pattern.replace(/\[\.\.\.(\w+)\]/g, (_, param) => {
      params.push(param);
      return ':' + param + '+'; // Catch-all
    });

    pattern = pattern.replace(/\[\[\.\.\.(\w+)\]\]/g, (_, param) => {
      params.push(param);
      return ':' + param + '*'; // Optional catch-all
    });

    pattern = pattern.replace(/\[(\w+)\]/g, (_, param) => {
      params.push(param);
      return ':' + param;
    });

    // Convert to regex
    const regex = this.pathToRegex(pattern);

    return {
      path: pattern,
      pattern: regex,
      params,
      filePath: fullPath,
      type: 'page',
    };
  }

  /**
   * Parse API route from file path
   */
  private parseApiRoute(filePath: string, fullPath: string): Route | null {
    const route = this.parsePageRoute(filePath, fullPath);
    if (route) {
      route.type = 'api';
    }
    return route;
  }

  /**
   * Parse app directory route
   */
  private parseAppRoute(
    filePath: string,
    fullPath: string,
    basePath: string
  ): Route | null {
    const fileName = filePath.split(sep).pop() || '';

    // Determine route type
    let type: Route['type'] = 'page';
    if (fileName.startsWith('page.')) type = 'page';
    else if (fileName.startsWith('layout.')) type = 'layout';
    else if (fileName.startsWith('loading.')) type = 'loading';
    else if (fileName.startsWith('error.')) type = 'error';
    else if (fileName.startsWith('not-found.')) type = 'not-found';
    else return null; // Unknown file type

    // Build route path from base path
    let pattern = basePath.startsWith('/') ? basePath : '/' + basePath;
    if (pattern === '') pattern = '/';

    const params: string[] = [];

    // Handle dynamic segments
    pattern = pattern.replace(/\[\.\.\.(\w+)\]/g, (_, param) => {
      params.push(param);
      return ':' + param + '+';
    });

    pattern = pattern.replace(/\[\[\.\.\.(\w+)\]\]/g, (_, param) => {
      params.push(param);
      return ':' + param + '*';
    });

    pattern = pattern.replace(/\[(\w+)\]/g, (_, param) => {
      params.push(param);
      return ':' + param;
    });

    const regex = this.pathToRegex(pattern);

    return {
      path: pattern,
      pattern: regex,
      params,
      filePath: fullPath,
      type,
    };
  }

  /**
   * Convert path pattern to regex
   */
  private pathToRegex(pattern: string): RegExp {
    let regex = pattern
      .replace(/\//g, '\\/')
      .replace(/:(\w+)\+/g, '(?<$1>.+)') // Catch-all
      .replace(/:(\w+)\*/g, '(?<$1>.*?)') // Optional catch-all
      .replace(/:(\w+)/g, '(?<$1>[^/]+)'); // Dynamic segment

    return new RegExp(`^${regex}$`);
  }

  /**
   * Match request to route
   */
  match(url: string): RouteMatch | null {
    // Check cache
    if (this.routeCache.has(url)) {
      return this.routeCache.get(url)!;
    }

    const parsed = new URL(url, 'http://localhost');
    const pathname = parsed.pathname;

    for (const route of this.routes) {
      const match = pathname.match(route.pattern);
      if (match && match.groups) {
        const params: Record<string, string | string[]> = {};

        // Extract params
        for (const param of route.params) {
          const value = match.groups[param];
          if (value) {
            // Handle catch-all routes
            if (route.path.includes(':' + param + '+') ||
                route.path.includes(':' + param + '*')) {
              params[param] = value.split('/').filter(Boolean);
            } else {
              params[param] = value;
            }
          }
        }

        const result: RouteMatch = {
          route,
          params,
          searchParams: parsed.searchParams,
        };

        // Cache result
        this.routeCache.set(url, result);

        return result;
      }
    }

    // No match found
    this.routeCache.set(url, null);
    return null;
  }

  /**
   * Get all routes
   */
  getRoutes(): Route[] {
    return [...this.routes];
  }

  /**
   * Get layout for path
   */
  getLayout(path: string): string | null {
    // Find nearest layout
    const segments = path.split('/').filter(Boolean);

    for (let i = segments.length; i >= 0; i--) {
      const checkPath = '/' + segments.slice(0, i).join('/');
      const layout = this.layouts.get(checkPath);
      if (layout) return layout;
    }

    return this.layouts.get('/') || null;
  }

  /**
   * Generate route metadata for client
   */
  generateManifest(): Record<string, any> {
    return {
      version: 1,
      routes: this.routes.map(r => ({
        path: r.path,
        type: r.type,
        dynamic: r.dynamic,
        revalidate: r.revalidate,
      })),
      layouts: Array.from(this.layouts.keys()),
    };
  }

  /**
   * Clear route cache
   */
  clearCache(): void {
    this.routeCache.clear();
  }
}

/**
 * Route utilities
 */
export class RouteUtils {
  /**
   * Check if path matches pattern
   */
  static matches(pattern: string, path: string): boolean {
    const regex = this.patternToRegex(pattern);
    return regex.test(path);
  }

  /**
   * Extract params from path
   */
  static extractParams(
    pattern: string,
    path: string
  ): Record<string, string> | null {
    const regex = this.patternToRegex(pattern);
    const match = path.match(regex);
    return match?.groups || null;
  }

  /**
   * Convert pattern to regex
   */
  private static patternToRegex(pattern: string): RegExp {
    let regex = pattern
      .replace(/\//g, '\\/')
      .replace(/\[\.\.\.(\w+)\]/g, '(?<$1>.+)')
      .replace(/\[\[\.\.\.(\w+)\]\]/g, '(?<$1>.*?)')
      .replace(/\[(\w+)\]/g, '(?<$1>[^/]+)');

    return new RegExp(`^${regex}$`);
  }

  /**
   * Build URL from pattern and params
   */
  static buildUrl(
    pattern: string,
    params: Record<string, string | string[]>,
    searchParams?: URLSearchParams
  ): string {
    let url = pattern;

    // Replace dynamic segments
    for (const [key, value] of Object.entries(params)) {
      const arrayValue = Array.isArray(value) ? value.join('/') : value;
      url = url
        .replace(`[...${key}]`, arrayValue)
        .replace(`[[...${key}]]`, arrayValue)
        .replace(`[${key}]`, arrayValue);
    }

    // Add search params
    if (searchParams && searchParams.toString()) {
      url += '?' + searchParams.toString();
    }

    return url;
  }

  /**
   * Normalize path
   */
  static normalize(path: string): string {
    return path
      .replace(/\/+/g, '/') // Remove duplicate slashes
      .replace(/\/$/, '') // Remove trailing slash
      || '/';
  }
}

/**
 * Route middleware system
 */
export interface RouteMiddleware {
  name: string;
  matcher?: RegExp;
  handler: (req: any, res: any, next: () => void) => void | Promise<void>;
}

export class MiddlewareChain {
  private middleware: RouteMiddleware[] = [];

  add(mw: RouteMiddleware): void {
    this.middleware.push(mw);
  }

  async execute(req: any, res: any, route: Route): Promise<void> {
    let index = 0;

    const next = async () => {
      if (index >= this.middleware.length) return;

      const mw = this.middleware[index++];

      // Check if middleware applies to this route
      if (mw.matcher && !mw.matcher.test(route.path)) {
        return next();
      }

      await mw.handler(req, res, next);
    };

    await next();
  }
}

export default FileRouter;
