/**
 * Advanced Routing Examples for API Gateway
 * Demonstrates complex routing patterns:
 * - Path-based routing
 * - Header-based routing
 * - Method-based routing
 * - Content-type routing
 * - A/B testing routing
 * - Canary deployments
 * - Geographic routing
 * - Load-based routing
 */

interface RouteMatch {
  matched: boolean;
  params?: Record<string, string>;
  score: number;
}

interface RouteConfig {
  path?: string | RegExp;
  method?: string | string[];
  headers?: Record<string, string | RegExp>;
  query?: Record<string, string | RegExp>;
  host?: string | RegExp;
  weight?: number;
  priority?: number;
}

interface Backend {
  id: string;
  url: string;
  weight?: number;
  health?: "healthy" | "unhealthy" | "unknown";
  metadata?: Record<string, any>;
}

/**
 * Route Matcher
 * Matches incoming requests against route definitions
 */
export class RouteMatcher {
  /**
   * Match path pattern
   */
  matchPath(path: string, pattern: string | RegExp): RouteMatch {
    if (typeof pattern === "string") {
      // Extract parameters from pattern
      const paramNames: string[] = [];
      const regexPattern = pattern.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      });

      const regex = new RegExp(`^${regexPattern}$`);
      const match = path.match(regex);

      if (!match) {
        return { matched: false, score: 0 };
      }

      const params: Record<string, string> = {};
      paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });

      return {
        matched: true,
        params,
        score: pattern.length,
      };
    } else {
      // RegExp pattern
      const match = path.match(pattern);
      return {
        matched: match !== null,
        params: match ? { ...match.groups } : undefined,
        score: pattern.source.length,
      };
    }
  }

  /**
   * Match method
   */
  matchMethod(method: string, pattern: string | string[]): RouteMatch {
    const methods = Array.isArray(pattern) ? pattern : [pattern];
    const matched = methods.includes(method.toUpperCase());

    return {
      matched,
      score: matched ? 10 : 0,
    };
  }

  /**
   * Match headers
   */
  matchHeaders(
    headers: Record<string, string>,
    patterns: Record<string, string | RegExp>,
  ): RouteMatch {
    let score = 0;

    for (const [key, pattern] of Object.entries(patterns)) {
      const headerValue = headers[key.toLowerCase()];

      if (!headerValue) {
        return { matched: false, score: 0 };
      }

      if (typeof pattern === "string") {
        if (headerValue !== pattern) {
          return { matched: false, score: 0 };
        }
      } else {
        if (!pattern.test(headerValue)) {
          return { matched: false, score: 0 };
        }
      }

      score += 5;
    }

    return { matched: true, score };
  }

  /**
   * Match query parameters
   */
  matchQuery(
    query: Record<string, string>,
    patterns: Record<string, string | RegExp>,
  ): RouteMatch {
    let score = 0;

    for (const [key, pattern] of Object.entries(patterns)) {
      const queryValue = query[key];

      if (!queryValue) {
        return { matched: false, score: 0 };
      }

      if (typeof pattern === "string") {
        if (queryValue !== pattern) {
          return { matched: false, score: 0 };
        }
      } else {
        if (!pattern.test(queryValue)) {
          return { matched: false, score: 0 };
        }
      }

      score += 3;
    }

    return { matched: true, score };
  }

  /**
   * Match host
   */
  matchHost(host: string, pattern: string | RegExp): RouteMatch {
    if (typeof pattern === "string") {
      return {
        matched: host === pattern,
        score: host === pattern ? 20 : 0,
      };
    } else {
      const matched = pattern.test(host);
      return {
        matched,
        score: matched ? 20 : 0,
      };
    }
  }
}

/**
 * Route Definition
 */
export class Route {
  private config: RouteConfig;
  private backends: Backend[];
  private matcher: RouteMatcher;

  constructor(config: RouteConfig, backends: Backend[]) {
    this.config = config;
    this.backends = backends;
    this.matcher = new RouteMatcher();
  }

  match(request: {
    path: string;
    method: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    host?: string;
  }): RouteMatch {
    let totalScore = 0;
    const params: Record<string, string> = {};

    // Match path
    if (this.config.path) {
      const pathMatch = this.matcher.matchPath(request.path, this.config.path);
      if (!pathMatch.matched) {
        return { matched: false, score: 0 };
      }
      totalScore += pathMatch.score;
      if (pathMatch.params) {
        Object.assign(params, pathMatch.params);
      }
    }

    // Match method
    if (this.config.method) {
      const methodMatch = this.matcher.matchMethod(request.method, this.config.method);
      if (!methodMatch.matched) {
        return { matched: false, score: 0 };
      }
      totalScore += methodMatch.score;
    }

    // Match headers
    if (this.config.headers) {
      const headerMatch = this.matcher.matchHeaders(request.headers, this.config.headers);
      if (!headerMatch.matched) {
        return { matched: false, score: 0 };
      }
      totalScore += headerMatch.score;
    }

    // Match query
    if (this.config.query && request.query) {
      const queryMatch = this.matcher.matchQuery(request.query, this.config.query);
      if (!queryMatch.matched) {
        return { matched: false, score: 0 };
      }
      totalScore += queryMatch.score;
    }

    // Match host
    if (this.config.host && request.host) {
      const hostMatch = this.matcher.matchHost(request.host, this.config.host);
      if (!hostMatch.matched) {
        return { matched: false, score: 0 };
      }
      totalScore += hostMatch.score;
    }

    // Add priority bonus
    if (this.config.priority) {
      totalScore += this.config.priority;
    }

    return {
      matched: true,
      params,
      score: totalScore,
    };
  }

  selectBackend(strategy: "round-robin" | "weighted" | "random" = "weighted"): Backend {
    const healthyBackends = this.backends.filter(
      (b) => b.health !== "unhealthy",
    );

    if (healthyBackends.length === 0) {
      throw new Error("No healthy backends available");
    }

    if (strategy === "random") {
      const index = Math.floor(Math.random() * healthyBackends.length);
      return healthyBackends[index];
    }

    if (strategy === "weighted") {
      const totalWeight = healthyBackends.reduce(
        (sum, b) => sum + (b.weight || 1),
        0,
      );
      let random = Math.random() * totalWeight;

      for (const backend of healthyBackends) {
        random -= backend.weight || 1;
        if (random <= 0) {
          return backend;
        }
      }

      return healthyBackends[0];
    }

    // Round-robin
    const index = Math.floor(Date.now() / 1000) % healthyBackends.length;
    return healthyBackends[index];
  }

  getBackends(): Backend[] {
    return [...this.backends];
  }

  getConfig(): RouteConfig {
    return { ...this.config };
  }
}

/**
 * A/B Testing Router
 * Routes traffic based on experiment configuration
 */
export class ABTestingRouter {
  private experiments: Map<
    string,
    {
      variants: Array<{ name: string; weight: number; backend: Backend }>;
      userAssignments: Map<string, string>;
    }
  > = new Map();

  createExperiment(
    name: string,
    variants: Array<{ name: string; weight: number; backend: Backend }>,
  ): void {
    // Normalize weights
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const normalizedVariants = variants.map((v) => ({
      ...v,
      weight: v.weight / totalWeight,
    }));

    this.experiments.set(name, {
      variants: normalizedVariants,
      userAssignments: new Map(),
    });
  }

  selectVariant(experimentName: string, userId: string): Backend {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) {
      throw new Error(`Experiment ${experimentName} not found`);
    }

    // Check if user already assigned
    const assigned = experiment.userAssignments.get(userId);
    if (assigned) {
      const variant = experiment.variants.find((v) => v.name === assigned);
      if (variant) {
        return variant.backend;
      }
    }

    // Assign user to variant
    let random = Math.random();
    for (const variant of experiment.variants) {
      random -= variant.weight;
      if (random <= 0) {
        experiment.userAssignments.set(userId, variant.name);
        return variant.backend;
      }
    }

    // Fallback to first variant
    const firstVariant = experiment.variants[0];
    experiment.userAssignments.set(userId, firstVariant.name);
    return firstVariant.backend;
  }

  getExperimentStats(experimentName: string): {
    totalUsers: number;
    variantDistribution: Record<string, number>;
  } {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) {
      throw new Error(`Experiment ${experimentName} not found`);
    }

    const distribution: Record<string, number> = {};
    for (const [_, variant] of experiment.userAssignments) {
      distribution[variant] = (distribution[variant] || 0) + 1;
    }

    return {
      totalUsers: experiment.userAssignments.size,
      variantDistribution: distribution,
    };
  }
}

/**
 * Canary Deployment Router
 * Gradually shifts traffic to new version
 */
export class CanaryRouter {
  private canaryWeight: number = 0;
  private stableBackend: Backend;
  private canaryBackend: Backend;
  private rampUpRate: number; // Percentage per minute

  constructor(
    stableBackend: Backend,
    canaryBackend: Backend,
    initialWeight: number = 0,
    rampUpRate: number = 10,
  ) {
    this.stableBackend = stableBackend;
    this.canaryBackend = canaryBackend;
    this.canaryWeight = initialWeight;
    this.rampUpRate = rampUpRate;
  }

  selectBackend(): Backend {
    const random = Math.random() * 100;
    return random < this.canaryWeight ? this.canaryBackend : this.stableBackend;
  }

  increaseCanaryWeight(): void {
    this.canaryWeight = Math.min(100, this.canaryWeight + this.rampUpRate);
    console.log(`Canary weight increased to ${this.canaryWeight}%`);
  }

  decreaseCanaryWeight(): void {
    this.canaryWeight = Math.max(0, this.canaryWeight - this.rampUpRate);
    console.log(`Canary weight decreased to ${this.canaryWeight}%`);
  }

  promoteCanary(): void {
    this.canaryWeight = 100;
    console.log("Canary promoted to 100%");
  }

  rollbackCanary(): void {
    this.canaryWeight = 0;
    console.log("Canary rolled back to 0%");
  }

  getCanaryWeight(): number {
    return this.canaryWeight;
  }

  startAutoRampUp(): NodeJS.Timeout {
    return setInterval(() => {
      if (this.canaryWeight < 100) {
        this.increaseCanaryWeight();
      }
    }, 60000); // Every minute
  }
}

/**
 * Geographic Router
 * Routes based on geographic location
 */
export class GeographicRouter {
  private regionalBackends: Map<string, Backend[]> = new Map();
  private defaultBackends: Backend[] = [];

  registerRegion(region: string, backends: Backend[]): void {
    this.regionalBackends.set(region, backends);
  }

  setDefaultBackends(backends: Backend[]): void {
    this.defaultBackends = backends;
  }

  selectBackend(region: string): Backend {
    const backends = this.regionalBackends.get(region) || this.defaultBackends;

    if (backends.length === 0) {
      throw new Error(`No backends available for region ${region}`);
    }

    // Simple round-robin
    const index = Math.floor(Date.now() / 1000) % backends.length;
    return backends[index];
  }

  getRegions(): string[] {
    return Array.from(this.regionalBackends.keys());
  }
}

/**
 * Load-Based Router
 * Routes based on backend load
 */
export class LoadBasedRouter {
  private backends: Array<Backend & { currentLoad: number; maxLoad: number }> = [];

  registerBackend(backend: Backend, maxLoad: number): void {
    this.backends.push({
      ...backend,
      currentLoad: 0,
      maxLoad,
    });
  }

  selectBackend(): Backend {
    // Find backend with lowest load ratio
    const available = this.backends.filter(
      (b) => b.currentLoad < b.maxLoad && b.health === "healthy",
    );

    if (available.length === 0) {
      throw new Error("No available backends");
    }

    available.sort((a, b) => {
      const ratioA = a.currentLoad / a.maxLoad;
      const ratioB = b.currentLoad / b.maxLoad;
      return ratioA - ratioB;
    });

    return available[0];
  }

  recordRequest(backendId: string): void {
    const backend = this.backends.find((b) => b.id === backendId);
    if (backend) {
      backend.currentLoad++;
    }
  }

  releaseRequest(backendId: string): void {
    const backend = this.backends.find((b) => b.id === backendId);
    if (backend) {
      backend.currentLoad = Math.max(0, backend.currentLoad - 1);
    }
  }

  getBackendStats(): Array<{
    id: string;
    currentLoad: number;
    maxLoad: number;
    loadRatio: number;
  }> {
    return this.backends.map((b) => ({
      id: b.id,
      currentLoad: b.currentLoad,
      maxLoad: b.maxLoad,
      loadRatio: b.currentLoad / b.maxLoad,
    }));
  }
}

/**
 * Advanced Router
 * Combines all routing strategies
 */
export class AdvancedRouter {
  private routes: Route[] = [];
  private abTestingRouter: ABTestingRouter;
  private canaryRouter?: CanaryRouter;
  private geoRouter: GeographicRouter;
  private loadRouter: LoadBasedRouter;

  constructor() {
    this.abTestingRouter = new ABTestingRouter();
    this.geoRouter = new GeographicRouter();
    this.loadRouter = new LoadBasedRouter();
  }

  addRoute(config: RouteConfig, backends: Backend[]): void {
    const route = new Route(config, backends);
    this.routes.push(route);

    // Sort by priority
    this.routes.sort((a, b) => {
      const priorityA = a.getConfig().priority || 0;
      const priorityB = b.getConfig().priority || 0;
      return priorityB - priorityA;
    });
  }

  findRoute(request: {
    path: string;
    method: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    host?: string;
  }): { route: Route; params: Record<string, string> } | null {
    let bestMatch: { route: Route; match: RouteMatch } | null = null;

    for (const route of this.routes) {
      const match = route.match(request);

      if (match.matched) {
        if (!bestMatch || match.score > bestMatch.match.score) {
          bestMatch = { route, match };
        }
      }
    }

    if (!bestMatch) {
      return null;
    }

    return {
      route: bestMatch.route,
      params: bestMatch.match.params || {},
    };
  }

  getABTestingRouter(): ABTestingRouter {
    return this.abTestingRouter;
  }

  setCanaryRouter(router: CanaryRouter): void {
    this.canaryRouter = router;
  }

  getCanaryRouter(): CanaryRouter | undefined {
    return this.canaryRouter;
  }

  getGeoRouter(): GeographicRouter {
    return this.geoRouter;
  }

  getLoadRouter(): LoadBasedRouter {
    return this.loadRouter;
  }

  getRoutes(): Route[] {
    return [...this.routes];
  }
}

/**
 * Example usage
 */
function exampleUsage() {
  const router = new AdvancedRouter();

  // Example 1: Path-based routing
  router.addRoute(
    {
      path: "/api/v1/users/:id",
      method: "GET",
      priority: 10,
    },
    [
      { id: "backend-1", url: "http://backend1.example.com", weight: 70, health: "healthy" },
      { id: "backend-2", url: "http://backend2.example.com", weight: 30, health: "healthy" },
    ],
  );

  // Example 2: Header-based routing
  router.addRoute(
    {
      path: "/api/v1/users",
      method: "POST",
      headers: {
        "content-type": /^application\/json/,
      },
      priority: 8,
    },
    [{ id: "backend-3", url: "http://backend3.example.com", health: "healthy" }],
  );

  // Example 3: A/B Testing
  const abRouter = router.getABTestingRouter();
  abRouter.createExperiment("new-ui", [
    {
      name: "control",
      weight: 50,
      backend: { id: "ui-old", url: "http://old.example.com", health: "healthy" },
    },
    {
      name: "variant",
      weight: 50,
      backend: { id: "ui-new", url: "http://new.example.com", health: "healthy" },
    },
  ]);

  // Example 4: Canary deployment
  const canaryRouter = new CanaryRouter(
    { id: "stable", url: "http://stable.example.com", health: "healthy" },
    { id: "canary", url: "http://canary.example.com", health: "healthy" },
    10, // 10% initial traffic
    5, // Increase by 5% per minute
  );
  router.setCanaryRouter(canaryRouter);

  // Test routing
  const request = {
    path: "/api/v1/users/123",
    method: "GET",
    headers: {},
  };

  const result = router.findRoute(request);
  if (result) {
    console.log("Matched route:", result.route.getConfig());
    console.log("Path params:", result.params);
    console.log("Selected backend:", result.route.selectBackend("weighted"));
  }
}

if (require.main === module) {
  exampleUsage();
}

export default AdvancedRouter;
