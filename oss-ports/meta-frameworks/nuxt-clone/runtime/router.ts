/**
 * File-based Router for Nuxt Clone
 *
 * Features:
 * - Pages directory routing
 * - Dynamic routes ([id])
 * - Catch-all routes ([...slug])
 * - Nested routes
 * - Route params and query
 */

import { RouteRecordRaw, createRouter, createMemoryHistory, createWebHistory } from 'vue-router';
import { readdir, stat } from 'fs/promises';
import { join, relative, sep } from 'path';

export interface NuxtRoute extends RouteRecordRaw {
  file: string;
  children?: NuxtRoute[];
}

export class NuxtRouter {
  private routes: NuxtRoute[] = [];
  private pagesDir: string;

  constructor(pagesDir: string) {
    this.pagesDir = pagesDir;
  }

  /**
   * Build route tree from pages directory
   */
  async build(): Promise<void> {
    console.log('[Router] Building routes...');
    const start = performance.now();

    this.routes = await this.scanDirectory(this.pagesDir);

    const elapsed = performance.now() - start;
    console.log(`[Router] Built ${this.flattenRoutes(this.routes).length} routes in ${elapsed.toFixed(2)}ms`);
  }

  /**
   * Scan directory for pages
   */
  private async scanDirectory(dir: string, basePath = ''): Promise<NuxtRoute[]> {
    const routes: NuxtRoute[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Check for index file in directory
        const indexRoute = await this.createRoute(fullPath, relativePath);
        if (indexRoute) {
          // Directory with children
          const children = await this.scanDirectory(fullPath, relativePath);
          if (children.length > 0) {
            indexRoute.children = children;
          }
          routes.push(indexRoute);
        } else {
          // No index, just nested routes
          const children = await this.scanDirectory(fullPath, relativePath);
          routes.push(...children);
        }
      } else if (entry.isFile() && this.isPageFile(entry.name)) {
        const route = await this.createRoute(fullPath, relativePath);
        if (route) {
          routes.push(route);
        }
      }
    }

    return routes;
  }

  /**
   * Create route from file
   */
  private async createRoute(fullPath: string, relativePath: string): Promise<NuxtRoute | null> {
    // Check if index file exists
    const indexFiles = ['index.vue', 'index.ts', 'index.tsx'];
    let isIndex = false;
    let filePath = fullPath;

    for (const indexFile of indexFiles) {
      const indexPath = join(fullPath, indexFile);
      try {
        await stat(indexPath);
        filePath = indexPath;
        isIndex = true;
        break;
      } catch {
        // File doesn't exist
      }
    }

    // If not index and not a file, return null
    if (!isIndex && !(await this.isFile(fullPath))) {
      return null;
    }

    // Parse route path
    let routePath = relativePath;

    // Remove file extension
    const extensions = ['.vue', '.tsx', '.ts', '.jsx', '.js'];
    for (const ext of extensions) {
      if (routePath.endsWith(ext)) {
        routePath = routePath.slice(0, -ext.length);
        break;
      }
    }

    // Handle index
    if (routePath.endsWith('/index') || routePath === 'index') {
      routePath = routePath.slice(0, -6) || '/';
    }

    // Ensure leading slash
    if (!routePath.startsWith('/')) {
      routePath = '/' + routePath;
    }

    // Parse route name
    const name = this.generateRouteName(routePath);

    // Handle dynamic segments
    const path = this.parseRoutePath(routePath);

    return {
      name,
      path,
      file: filePath,
      component: () => import(filePath),
    };
  }

  /**
   * Parse route path with dynamic segments
   */
  private parseRoutePath(path: string): string {
    return path
      // Catch-all: [...slug] -> :slug(.*)
      .replace(/\[\.\.\.(\w+)\]/g, ':$1(.*)')
      // Dynamic: [id] -> :id
      .replace(/\[(\w+)\]/g, ':$1');
  }

  /**
   * Generate route name
   */
  private generateRouteName(path: string): string {
    return path
      .replace(/^\//, '')
      .replace(/\//g, '-')
      .replace(/\[\.\.\.(\w+)\]/g, '$1-all')
      .replace(/\[(\w+)\]/g, '$1')
      || 'index';
  }

  /**
   * Check if path is a file
   */
  private async isFile(path: string): Promise<boolean> {
    try {
      const stats = await stat(path);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Check if file is a page
   */
  private isPageFile(filename: string): boolean {
    return /\.(vue|tsx?|jsx?)$/.test(filename) && !filename.startsWith('_');
  }

  /**
   * Flatten route tree
   */
  private flattenRoutes(routes: NuxtRoute[]): NuxtRoute[] {
    const flat: NuxtRoute[] = [];

    for (const route of routes) {
      flat.push(route);
      if (route.children) {
        flat.push(...this.flattenRoutes(route.children));
      }
    }

    return flat;
  }

  /**
   * Get routes
   */
  getRoutes(): NuxtRoute[] {
    return this.routes;
  }

  /**
   * Create Vue Router instance
   */
  createVueRouter(isServer = false) {
    return createRouter({
      history: isServer ? createMemoryHistory() : createWebHistory(),
      routes: this.routes,
    });
  }

  /**
   * Generate routes manifest
   */
  generateManifest(): Record<string, any> {
    return {
      version: 1,
      routes: this.flattenRoutes(this.routes).map(r => ({
        name: r.name,
        path: r.path,
        file: r.file,
      })),
    };
  }
}

/**
 * Route middleware system
 */
export interface RouteMiddleware {
  (to: any, from: any, next: () => void): void | Promise<void>;
}

export class MiddlewareRunner {
  private middleware: Map<string, RouteMiddleware> = new Map();

  /**
   * Register middleware
   */
  register(name: string, fn: RouteMiddleware): void {
    this.middleware.set(name, fn);
  }

  /**
   * Run middleware
   */
  async run(names: string[], to: any, from: any): Promise<void> {
    for (const name of names) {
      const fn = this.middleware.get(name);
      if (fn) {
        await new Promise<void>((resolve) => {
          fn(to, from, () => resolve());
        });
      }
    }
  }

  /**
   * Get all middleware
   */
  getAll(): Map<string, RouteMiddleware> {
    return new Map(this.middleware);
  }
}

export default NuxtRouter;
