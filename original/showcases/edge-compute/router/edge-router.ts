/**
 * Edge Router - Routes requests to functions based on rules
 *
 * Handles path-based routing, geolocation, load balancing, and failover.
 */

import { EventEmitter } from 'events';
import FunctionManager, { FunctionMetadata } from '../control-plane/function-manager';

export interface RouteConfig {
  path: string;
  functionId: string;
  methods?: string[];
  priority?: number;
  region?: string;
  weight?: number;
  enabled?: boolean;
}

export interface RouteMatch {
  route: RouteConfig;
  function: FunctionMetadata;
  params: Record<string, string>;
}

export interface RouterRequest {
  path: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  ip?: string;
  region?: string;
}

export class EdgeRouter extends EventEmitter {
  private routes: RouteConfig[];
  private functionManager: FunctionManager;
  private routeCache: Map<string, RouteMatch>;

  constructor(functionManager: FunctionManager) {
    super();
    this.routes = [];
    this.functionManager = functionManager;
    this.routeCache = new Map();
  }

  /**
   * Add a route
   */
  addRoute(config: RouteConfig): void {
    // Validate route
    if (!config.path || !config.functionId) {
      throw new Error('Route path and functionId are required');
    }

    // Set defaults
    const route: RouteConfig = {
      methods: config.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      priority: config.priority || 0,
      weight: config.weight || 1,
      enabled: config.enabled !== false,
      ...config,
    };

    // Add to routes
    this.routes.push(route);

    // Sort routes by priority (higher priority first)
    this.routes.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Clear cache
    this.routeCache.clear();

    this.emit('route:added', route);
  }

  /**
   * Remove a route
   */
  removeRoute(path: string): boolean {
    const index = this.routes.findIndex((r) => r.path === path);
    if (index === -1) return false;

    this.routes.splice(index, 1);
    this.routeCache.clear();

    this.emit('route:removed', path);
    return true;
  }

  /**
   * Update a route
   */
  updateRoute(path: string, updates: Partial<RouteConfig>): boolean {
    const route = this.routes.find((r) => r.path === path);
    if (!route) return false;

    Object.assign(route, updates);
    this.routeCache.clear();

    this.emit('route:updated', route);
    return true;
  }

  /**
   * Get all routes
   */
  getRoutes(): RouteConfig[] {
    return [...this.routes];
  }

  /**
   * Match a request to a route
   */
  match(request: RouterRequest): RouteMatch | null {
    // Check cache
    const cacheKey = `${request.method}:${request.path}:${request.region || 'default'}`;
    if (this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey)!;
    }

    // Find matching routes
    const matches: Array<{ route: RouteConfig; params: Record<string, string>; score: number }> =
      [];

    for (const route of this.routes) {
      if (!route.enabled) continue;

      // Check method
      if (route.methods && !route.methods.includes(request.method)) {
        continue;
      }

      // Check region
      if (route.region && request.region && route.region !== request.region) {
        continue;
      }

      // Check path
      const params = this.matchPath(route.path, request.path);
      if (!params) continue;

      // Calculate match score
      const score = this.calculateScore(route, request, params);

      matches.push({ route, params, score });
    }

    // Sort by score (higher is better)
    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) return null;

    // Select route based on weight (for load balancing)
    const selected = this.weightedSelect(matches);

    // Get function metadata
    const func = this.functionManager.get(selected.route.functionId);
    if (!func) return null;

    const match: RouteMatch = {
      route: selected.route,
      function: func,
      params: selected.params,
    };

    // Cache the match
    this.routeCache.set(cacheKey, match);

    return match;
  }

  /**
   * Get routing statistics
   */
  getStats(): {
    totalRoutes: number;
    enabledRoutes: number;
    disabledRoutes: number;
    byMethod: Record<string, number>;
    byRegion: Record<string, number>;
  } {
    const byMethod: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    let enabled = 0;
    let disabled = 0;

    for (const route of this.routes) {
      if (route.enabled) {
        enabled++;
      } else {
        disabled++;
      }

      for (const method of route.methods || []) {
        byMethod[method] = (byMethod[method] || 0) + 1;
      }

      if (route.region) {
        byRegion[route.region] = (byRegion[route.region] || 0) + 1;
      }
    }

    return {
      totalRoutes: this.routes.length,
      enabledRoutes: enabled,
      disabledRoutes: disabled,
      byMethod,
      byRegion,
    };
  }

  // Private helper methods

  private matchPath(pattern: string, path: string): Record<string, string> | null {
    // Convert pattern to regex
    const paramNames: string[] = [];
    const regexPattern = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${regexPattern}$`);
    const match = path.match(regex);

    if (!match) return null;

    // Extract parameters
    const params: Record<string, string> = {};
    paramNames.forEach((name, i) => {
      params[name] = match[i + 1];
    });

    return params;
  }

  private calculateScore(
    route: RouteConfig,
    request: RouterRequest,
    params: Record<string, string>
  ): number {
    let score = 0;

    // Priority
    score += (route.priority || 0) * 1000;

    // Exact path match vs parameterized
    const paramCount = Object.keys(params).length;
    score += (10 - paramCount) * 100;

    // Region match
    if (route.region && request.region && route.region === request.region) {
      score += 50;
    }

    // Method specificity
    if (route.methods && route.methods.length < 5) {
      score += 10;
    }

    return score;
  }

  private weightedSelect(
    matches: Array<{ route: RouteConfig; params: Record<string, string>; score: number }>
  ): { route: RouteConfig; params: Record<string, string> } {
    // If only one match, return it
    if (matches.length === 1) {
      return matches[0];
    }

    // Get all matches with the same score
    const topScore = matches[0].score;
    const topMatches = matches.filter((m) => m.score === topScore);

    // If only one top match, return it
    if (topMatches.length === 1) {
      return topMatches[0];
    }

    // Use weighted random selection for load balancing
    const totalWeight = topMatches.reduce((sum, m) => sum + (m.route.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const match of topMatches) {
      random -= match.route.weight || 1;
      if (random <= 0) {
        return match;
      }
    }

    return topMatches[0];
  }
}

export default EdgeRouter;
