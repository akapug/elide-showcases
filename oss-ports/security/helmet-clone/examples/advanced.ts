/**
 * @elide/helmet - Advanced Usage Examples
 * Advanced security header configurations and patterns
 */

import helmet from '@elide/helmet';
import * as crypto from 'crypto';

/**
 * Example 1: Dynamic CSP based on request context
 */
export function dynamicCSP(app: any) {
  app.use((req: any, res: any, next: any) => {
    // Generate nonce for this request
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;

    // Determine allowed sources based on user/route
    let scriptSources = ["'self'", `'nonce-${nonce}'`];
    let styleSources = ["'self'", `'nonce-${nonce}'`];

    // Add CDN for authenticated users
    if (req.user?.isPremium) {
      scriptSources.push('https://premium.cdn.com');
      styleSources.push('https://premium.cdn.com');
    }

    // Apply CSP
    helmet({
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'script-src': scriptSources,
          'style-src': styleSources,
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'", 'https://api.example.com'],
          'report-uri': ['/api/csp-violations']
        }
      }
    })(req, res, next);
  });
}

/**
 * Example 2: A/B testing with CSP
 */
export function abTestingCSP(app: any) {
  app.use((req: any, res: any, next: any) => {
    // Assign user to test group
    const testGroup = req.cookies.testGroup || (Math.random() > 0.5 ? 'A' : 'B');

    if (!req.cookies.testGroup) {
      res.cookie('testGroup', testGroup, { maxAge: 7 * 24 * 60 * 60 * 1000 });
    }

    // Different CSP for each group
    const cspDirectives = testGroup === 'A' ? {
      'script-src': ["'self'", "'unsafe-inline'"], // Relaxed for Group A
      'style-src': ["'self'", "'unsafe-inline'"]
    } : {
      'script-src': ["'self'"],                    // Strict for Group B
      'style-src': ["'self'"]
    };

    helmet({
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          ...cspDirectives
        }
      }
    })(req, res, next);
  });
}

/**
 * Example 3: Gradual CSP rollout with report-only mode
 */
export function gradualCSPRollout(app: any) {
  const rolloutPercentage = parseFloat(process.env.CSP_ROLLOUT_PERCENT || '10');

  app.use((req: any, res: any, next: any) => {
    const userId = req.user?.id || req.sessionID;
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const userPercentage = parseInt(hash.substring(0, 2), 16) / 255 * 100;

    const reportOnly = userPercentage > rolloutPercentage;

    helmet({
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'"],
          'report-uri': ['/api/csp-violations']
        },
        reportOnly
      }
    })(req, res, next);
  });
}

/**
 * Example 4: Security headers with caching strategy
 */
export function securityWithCaching(app: any) {
  app.use((req: any, res: any, next: any) => {
    // Static assets: aggressive caching, relaxed CSP
    if (req.path.startsWith('/static')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      helmet({
        contentSecurityPolicy: false
      })(req, res, next);
    }
    // Dynamic content: no caching, strict CSP
    else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

      helmet({
        contentSecurityPolicy: {
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'"],
            'style-src': ["'self'"]
          }
        }
      })(req, res, next);
    }
  });
}

/**
 * Example 5: Multi-tenant security headers
 */
export function multiTenantSecurity(app: any) {
  interface TenantConfig {
    allowedDomains: string[];
    strictMode: boolean;
  }

  const tenantConfigs: Record<string, TenantConfig> = {
    'tenant1': {
      allowedDomains: ['cdn.tenant1.com'],
      strictMode: true
    },
    'tenant2': {
      allowedDomains: ['cdn.tenant2.com', 'analytics.tenant2.com'],
      strictMode: false
    }
  };

  app.use((req: any, res: any, next: any) => {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const config = tenantConfigs[tenantId] || tenantConfigs['tenant1'];

    const scriptSources = ["'self'", ...config.allowedDomains];
    const connectSources = ["'self'", ...config.allowedDomains];

    if (!config.strictMode) {
      scriptSources.push("'unsafe-inline'");
    }

    helmet({
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'script-src': scriptSources,
          'connect-src': connectSources,
          'style-src': ["'self'", "'unsafe-inline'"]
        }
      }
    })(req, res, next);
  });
}

/**
 * Example 6: Geographic-based security
 */
export function geographicSecurity(app: any) {
  app.use((req: any, res: any, next: any) => {
    const country = req.headers['cf-ipcountry'] || req.ip; // Cloudflare header

    // Stricter security for certain regions
    const requiresStrictSecurity = ['CN', 'RU', 'KP'].includes(country as string);

    helmet({
      strictTransportSecurity: {
        maxAge: requiresStrictSecurity ? 63072000 : 31536000,
        includeSubDomains: true,
        preload: requiresStrictSecurity
      },
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'script-src': requiresStrictSecurity ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          'connect-src': ["'self'"]
        }
      }
    })(req, res, next);
  });
}

/**
 * Example 7: Performance monitoring with security headers
 */
export function performanceMonitoring(app: any) {
  app.use((req: any, res: any, next: any) => {
    const startTime = Date.now();

    helmet()(req, res, () => {
      const duration = Date.now() - startTime;

      // Log slow security header processing
      if (duration > 10) {
        console.warn(`Slow security headers: ${duration}ms for ${req.path}`);
      }

      next();
    });
  });
}

/**
 * Example 8: Content type specific headers
 */
export function contentTypeHeaders(app: any) {
  app.use((req: any, res: any, next: any) => {
    const acceptHeader = req.headers.accept || '';

    // API requests (JSON)
    if (acceptHeader.includes('application/json')) {
      helmet({
        contentSecurityPolicy: false,
        xFrameOptions: { action: 'DENY' }
      })(req, res, next);
    }
    // HTML responses
    else if (acceptHeader.includes('text/html')) {
      helmet({
        contentSecurityPolicy: {
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'"],
            'style-src': ["'self'", "'unsafe-inline'"]
          }
        }
      })(req, res, next);
    }
    // Other content types
    else {
      helmet()(req, res, next);
    }
  });
}

/**
 * Example 9: Feature flag based security
 */
export function featureFlagSecurity(app: any) {
  interface FeatureFlags {
    strictCSP: boolean;
    enableHSTS: boolean;
    enableCORP: boolean;
  }

  const getFeatureFlags = (userId: string): FeatureFlags => {
    // In real app, fetch from database or feature flag service
    return {
      strictCSP: true,
      enableHSTS: true,
      enableCORP: false
    };
  };

  app.use((req: any, res: any, next: any) => {
    const flags = getFeatureFlags(req.user?.id || 'anonymous');

    helmet({
      contentSecurityPolicy: flags.strictCSP ? {
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'"]
        }
      } : false,
      strictTransportSecurity: flags.enableHSTS ? {
        maxAge: 31536000,
        includeSubDomains: true
      } : false,
      crossOriginResourcePolicy: flags.enableCORP ? {
        policy: 'same-origin'
      } : false
    })(req, res, next);
  });
}

/**
 * Example 10: Request rate limiting with security headers
 */
export function rateLimitingSecurity(app: any) {
  const rateLimits = new Map<string, number>();

  app.use((req: any, res: any, next: any) => {
    const ip = req.ip;
    const count = rateLimits.get(ip) || 0;

    rateLimits.set(ip, count + 1);

    // Stricter headers for high-traffic IPs
    const isHighTraffic = count > 100;

    helmet({
      contentSecurityPolicy: isHighTraffic ? {
        directives: {
          'default-src': ["'none'"]
        }
      } : {
        directives: {
          'default-src': ["'self'"]
        }
      }
    })(req, res, next);

    // Clean up old entries
    setTimeout(() => {
      rateLimits.delete(ip);
    }, 60000);
  });
}
