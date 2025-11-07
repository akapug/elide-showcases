/**
 * Deploy Platform - Edge Router
 *
 * Handles routing, SSL termination, custom domains,
 * and request distribution.
 */

import { createHash } from 'crypto';

interface Route {
  deploymentId: string;
  domains: string[];
  paths: RouteRule[];
  sslCertificate?: SSLCertificate;
  headers?: Record<string, string>;
  redirects?: Redirect[];
  rewrites?: Rewrite[];
}

interface RouteRule {
  source: string;
  destination?: string;
  status?: number;
  methods?: string[];
  headers?: Record<string, string>;
}

interface SSLCertificate {
  domain: string;
  certificate: string;
  privateKey: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  autoRenew: boolean;
}

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

interface Rewrite {
  source: string;
  destination: string;
}

interface IncomingRequest {
  method: string;
  url: string;
  hostname: string;
  path: string;
  headers: Map<string, string>;
  body?: any;
  query: URLSearchParams;
  ip: string;
}

interface RouterResponse {
  status: number;
  headers: Map<string, string>;
  body: any;
  deploymentId?: string;
  cacheStatus?: 'hit' | 'miss' | 'bypass';
  responseTime: number;
}

/**
 * Edge Router
 */
export class EdgeRouter {
  private routes: Map<string, Route> = new Map();
  private wildcardRoutes: Route[] = [];
  private sslCertificates: Map<string, SSLCertificate> = new Map();

  /**
   * Register route
   */
  registerRoute(route: Route): void {
    // Register each domain
    for (const domain of route.domains) {
      if (domain.includes('*')) {
        // Wildcard domain
        this.wildcardRoutes.push(route);
      } else {
        this.routes.set(domain, route);
      }
    }

    // Register SSL certificate
    if (route.sslCertificate) {
      for (const domain of route.domains) {
        this.sslCertificates.set(domain, route.sslCertificate);
      }
    }

    console.log(`Registered route for ${route.domains.join(', ')}`);
  }

  /**
   * Unregister route
   */
  unregisterRoute(deploymentId: string): void {
    // Remove from direct routes
    for (const [domain, route] of this.routes.entries()) {
      if (route.deploymentId === deploymentId) {
        this.routes.delete(domain);
      }
    }

    // Remove from wildcard routes
    this.wildcardRoutes = this.wildcardRoutes.filter(
      r => r.deploymentId !== deploymentId
    );

    console.log(`Unregistered route for ${deploymentId}`);
  }

  /**
   * Handle incoming request
   */
  async handleRequest(request: IncomingRequest): Promise<RouterResponse> {
    const startTime = Date.now();

    try {
      // Find matching route
      const route = this.findRoute(request.hostname, request.path);

      if (!route) {
        return this.notFoundResponse(startTime);
      }

      // Check SSL
      if (!this.hasValidSSL(request.hostname)) {
        return this.sslErrorResponse(startTime);
      }

      // Apply redirects
      const redirect = this.findRedirect(route, request.path);
      if (redirect) {
        return this.redirectResponse(redirect, startTime);
      }

      // Apply rewrites
      const rewrite = this.findRewrite(route, request.path);
      if (rewrite) {
        request.path = this.applyRewrite(rewrite, request.path);
      }

      // Apply route rules
      const ruleResult = this.applyRouteRules(route, request);
      if (ruleResult) {
        return ruleResult;
      }

      // Apply headers
      const headers = this.buildHeaders(route, request);

      // Forward to deployment
      const response = await this.forwardToDeployment(route.deploymentId, request);

      return {
        ...response,
        headers: new Map([...response.headers, ...headers]),
        deploymentId: route.deploymentId,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Router error:', error);
      return this.errorResponse(String(error), startTime);
    }
  }

  /**
   * Find matching route
   */
  private findRoute(hostname: string, path: string): Route | null {
    // Direct match
    const directRoute = this.routes.get(hostname);
    if (directRoute) {
      return directRoute;
    }

    // Wildcard match
    for (const route of this.wildcardRoutes) {
      for (const domain of route.domains) {
        if (this.matchWildcard(hostname, domain)) {
          return route;
        }
      }
    }

    return null;
  }

  /**
   * Match wildcard domain
   */
  private matchWildcard(hostname: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
    );

    return regex.test(hostname);
  }

  /**
   * Check SSL certificate
   */
  private hasValidSSL(domain: string): boolean {
    const cert = this.sslCertificates.get(domain);

    if (!cert) {
      return false;
    }

    const now = new Date();
    return now >= cert.validFrom && now <= cert.validTo;
  }

  /**
   * Find redirect
   */
  private findRedirect(route: Route, path: string): Redirect | null {
    if (!route.redirects) {
      return null;
    }

    for (const redirect of route.redirects) {
      if (this.matchPath(path, redirect.source)) {
        return redirect;
      }
    }

    return null;
  }

  /**
   * Find rewrite
   */
  private findRewrite(route: Route, path: string): Rewrite | null {
    if (!route.rewrites) {
      return null;
    }

    for (const rewrite of route.rewrites) {
      if (this.matchPath(path, rewrite.source)) {
        return rewrite;
      }
    }

    return null;
  }

  /**
   * Match path pattern
   */
  private matchPath(path: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$'
    );

    return regex.test(path);
  }

  /**
   * Apply rewrite
   */
  private applyRewrite(rewrite: Rewrite, path: string): string {
    const regex = new RegExp(
      '^' + rewrite.source.replace(/:[^/]+/g, '([^/]+)') + '$'
    );

    return path.replace(regex, rewrite.destination);
  }

  /**
   * Apply route rules
   */
  private applyRouteRules(
    route: Route,
    request: IncomingRequest
  ): RouterResponse | null {
    for (const rule of route.paths) {
      if (!this.matchPath(request.path, rule.source)) {
        continue;
      }

      // Check method
      if (rule.methods && !rule.methods.includes(request.method)) {
        continue;
      }

      // Return custom response
      if (rule.status) {
        return {
          status: rule.status,
          headers: new Map(Object.entries(rule.headers || {})),
          body: rule.destination || '',
          responseTime: 0
        };
      }
    }

    return null;
  }

  /**
   * Build response headers
   */
  private buildHeaders(route: Route, request: IncomingRequest): Map<string, string> {
    const headers = new Map<string, string>();

    // Default security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-XSS-Protection', '1; mode=block');

    // CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Custom headers from route
    if (route.headers) {
      for (const [key, value] of Object.entries(route.headers)) {
        headers.set(key, value);
      }
    }

    return headers;
  }

  /**
   * Forward to deployment
   */
  private async forwardToDeployment(
    deploymentId: string,
    request: IncomingRequest
  ): Promise<RouterResponse> {
    // In production, this would forward to the actual deployment
    // Mock response
    return {
      status: 200,
      headers: new Map([['Content-Type', 'text/html']]),
      body: '<html><body>Hello from deployment!</body></html>',
      responseTime: 0
    };
  }

  /**
   * Not found response
   */
  private notFoundResponse(startTime: number): RouterResponse {
    return {
      status: 404,
      headers: new Map([['Content-Type', 'text/plain']]),
      body: 'Not Found',
      responseTime: Date.now() - startTime
    };
  }

  /**
   * SSL error response
   */
  private sslErrorResponse(startTime: number): RouterResponse {
    return {
      status: 526,
      headers: new Map([['Content-Type', 'text/plain']]),
      body: 'Invalid SSL Certificate',
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Redirect response
   */
  private redirectResponse(redirect: Redirect, startTime: number): RouterResponse {
    return {
      status: redirect.permanent ? 301 : 302,
      headers: new Map([['Location', redirect.destination]]),
      body: '',
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Error response
   */
  private errorResponse(error: string, startTime: number): RouterResponse {
    return {
      status: 500,
      headers: new Map([['Content-Type', 'text/plain']]),
      body: `Internal Server Error: ${error}`,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Get route stats
   */
  getStats(): {
    totalRoutes: number;
    totalDomains: number;
    totalSSLCertificates: number;
  } {
    const domains = new Set<string>();

    for (const route of this.routes.values()) {
      route.domains.forEach(d => domains.add(d));
    }

    for (const route of this.wildcardRoutes) {
      route.domains.forEach(d => domains.add(d));
    }

    return {
      totalRoutes: this.routes.size + this.wildcardRoutes.length,
      totalDomains: domains.size,
      totalSSLCertificates: this.sslCertificates.size
    };
  }
}

/**
 * SSL Manager
 */
export class SSLManager {
  private certificates: Map<string, SSLCertificate> = new Map();

  /**
   * Issue certificate
   */
  async issueCertificate(domain: string): Promise<SSLCertificate> {
    console.log(`Issuing SSL certificate for ${domain}...`);

    // Mock certificate generation
    const cert: SSLCertificate = {
      domain,
      certificate: this.generateMockCertificate(domain),
      privateKey: this.generateMockPrivateKey(),
      issuer: "Let's Encrypt",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      autoRenew: true
    };

    this.certificates.set(domain, cert);

    console.log(`Certificate issued for ${domain}`);
    return cert;
  }

  /**
   * Renew certificate
   */
  async renewCertificate(domain: string): Promise<SSLCertificate> {
    console.log(`Renewing SSL certificate for ${domain}...`);

    const oldCert = this.certificates.get(domain);

    if (!oldCert) {
      throw new Error(`Certificate for ${domain} not found`);
    }

    // Issue new certificate
    const newCert = await this.issueCertificate(domain);

    console.log(`Certificate renewed for ${domain}`);
    return newCert;
  }

  /**
   * Check certificate expiry
   */
  checkExpiry(domain: string): { expiring: boolean; daysUntilExpiry: number } {
    const cert = this.certificates.get(domain);

    if (!cert) {
      return { expiring: false, daysUntilExpiry: 0 };
    }

    const now = Date.now();
    const expiry = cert.validTo.getTime();
    const daysUntilExpiry = Math.floor((expiry - now) / (24 * 60 * 60 * 1000));

    return {
      expiring: daysUntilExpiry < 30,
      daysUntilExpiry
    };
  }

  /**
   * Auto-renew expiring certificates
   */
  async autoRenewCertificates(): Promise<void> {
    for (const [domain, cert] of this.certificates.entries()) {
      if (!cert.autoRenew) continue;

      const { expiring } = this.checkExpiry(domain);

      if (expiring) {
        await this.renewCertificate(domain);
      }
    }
  }

  /**
   * Generate mock certificate
   */
  private generateMockCertificate(domain: string): string {
    return `-----BEGIN CERTIFICATE-----
MOCK_CERTIFICATE_FOR_${domain}
-----END CERTIFICATE-----`;
  }

  /**
   * Generate mock private key
   */
  private generateMockPrivateKey(): string {
    return `-----BEGIN PRIVATE KEY-----
MOCK_PRIVATE_KEY
-----END PRIVATE KEY-----`;
  }
}

/**
 * Load Balancer
 */
export class LoadBalancer {
  private backends: Map<string, string[]> = new Map();
  private lastUsed: Map<string, number> = new Map();

  /**
   * Register backend
   */
  registerBackend(deploymentId: string, instanceUrl: string): void {
    if (!this.backends.has(deploymentId)) {
      this.backends.set(deploymentId, []);
    }

    this.backends.get(deploymentId)!.push(instanceUrl);
    console.log(`Registered backend ${instanceUrl} for ${deploymentId}`);
  }

  /**
   * Unregister backend
   */
  unregisterBackend(deploymentId: string, instanceUrl: string): void {
    const backends = this.backends.get(deploymentId);

    if (backends) {
      const index = backends.indexOf(instanceUrl);
      if (index > -1) {
        backends.splice(index, 1);
      }
    }

    console.log(`Unregistered backend ${instanceUrl} for ${deploymentId}`);
  }

  /**
   * Get next backend (round-robin)
   */
  getNextBackend(deploymentId: string): string | null {
    const backends = this.backends.get(deploymentId);

    if (!backends || backends.length === 0) {
      return null;
    }

    const lastIndex = this.lastUsed.get(deploymentId) || 0;
    const nextIndex = (lastIndex + 1) % backends.length;

    this.lastUsed.set(deploymentId, nextIndex);

    return backends[nextIndex];
  }
}

export const edgeRouter = new EdgeRouter();
export const sslManager = new SSLManager();
export const loadBalancer = new LoadBalancer();
