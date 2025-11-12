/**
 * Elide Helmet - Universal Security Headers Middleware
 *
 * Set security-related HTTP headers across all languages.
 * Helps protect against common web vulnerabilities.
 */

export interface HelmetOptions {
  contentSecurityPolicy?: ContentSecurityPolicyOptions | boolean;
  dnsPrefetchControl?: { allow?: boolean } | boolean;
  frameguard?: { action?: 'deny' | 'sameorigin' } | boolean;
  hidePoweredBy?: boolean;
  hsts?: HstsOptions | boolean;
  ieNoOpen?: boolean;
  noSniff?: boolean;
  referrerPolicy?: { policy?: string } | boolean;
  xssFilter?: boolean;
}

export interface ContentSecurityPolicyOptions {
  directives?: Record<string, string[] | string>;
  reportOnly?: boolean;
}

export interface HstsOptions {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

const DEFAULT_OPTIONS: HelmetOptions = {
  contentSecurityPolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: true,
  xssFilter: true
};

// Build CSP directive string
function buildCspDirective(directives: Record<string, string[] | string>): string {
  return Object.entries(directives)
    .map(([key, value]) => {
      const directive = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
      const values = Array.isArray(value) ? value.join(' ') : value;
      return `${directive} ${values}`;
    })
    .join('; ');
}

// Helmet middleware
export function helmet(options: HelmetOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return (req: any, res: any, next: () => void) => {
    // Content Security Policy
    if (opts.contentSecurityPolicy !== false) {
      const cspOpts = typeof opts.contentSecurityPolicy === 'object'
        ? opts.contentSecurityPolicy
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              fontSrc: ["'self'"],
              connectSrc: ["'self'"],
              frameSrc: ["'none'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: []
            }
          };

      const headerName = cspOpts.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';

      const headerValue = buildCspDirective(cspOpts.directives || {});
      setHeader(res, headerName, headerValue);
    }

    // DNS Prefetch Control
    if (opts.dnsPrefetchControl !== false) {
      const allow = typeof opts.dnsPrefetchControl === 'object'
        ? opts.dnsPrefetchControl.allow
        : false;
      setHeader(res, 'X-DNS-Prefetch-Control', allow ? 'on' : 'off');
    }

    // Frameguard (X-Frame-Options)
    if (opts.frameguard !== false) {
      const action = typeof opts.frameguard === 'object'
        ? opts.frameguard.action
        : 'sameorigin';
      setHeader(res, 'X-Frame-Options', action.toUpperCase());
    }

    // Hide Powered-By
    if (opts.hidePoweredBy !== false) {
      res.removeHeader?.('X-Powered-By');
    }

    // HSTS (HTTP Strict Transport Security)
    if (opts.hsts !== false) {
      const hstsOpts = typeof opts.hsts === 'object'
        ? opts.hsts
        : { maxAge: 15552000, includeSubDomains: true };

      let hstsValue = `max-age=${hstsOpts.maxAge || 15552000}`;
      if (hstsOpts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (hstsOpts.preload) {
        hstsValue += '; preload';
      }
      setHeader(res, 'Strict-Transport-Security', hstsValue);
    }

    // IE No Open (X-Download-Options)
    if (opts.ieNoOpen !== false) {
      setHeader(res, 'X-Download-Options', 'noopen');
    }

    // No Sniff (X-Content-Type-Options)
    if (opts.noSniff !== false) {
      setHeader(res, 'X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (opts.referrerPolicy !== false) {
      const policy = typeof opts.referrerPolicy === 'object'
        ? opts.referrerPolicy.policy
        : 'no-referrer';
      setHeader(res, 'Referrer-Policy', policy);
    }

    // XSS Filter (X-XSS-Protection)
    if (opts.xssFilter !== false) {
      setHeader(res, 'X-XSS-Protection', '1; mode=block');
    }

    next();
  };
}

// Helper to set header
function setHeader(res: any, name: string, value: string) {
  if (res.setHeader) {
    res.setHeader(name, value);
  } else if (res.headers) {
    res.headers[name] = value;
  }
}

// Individual middleware functions
export const contentSecurityPolicy = (options?: ContentSecurityPolicyOptions) =>
  helmet({ contentSecurityPolicy: options || true });

export const dnsPrefetchControl = (options?: { allow?: boolean }) =>
  helmet({ dnsPrefetchControl: options || true });

export const frameguard = (options?: { action?: 'deny' | 'sameorigin' }) =>
  helmet({ frameguard: options || true });

export const hidePoweredBy = () =>
  helmet({ hidePoweredBy: true });

export const hsts = (options?: HstsOptions) =>
  helmet({ hsts: options || true });

export const ieNoOpen = () =>
  helmet({ ieNoOpen: true });

export const noSniff = () =>
  helmet({ noSniff: true });

export const referrerPolicy = (options?: { policy?: string }) =>
  helmet({ referrerPolicy: options || true });

export const xssFilter = () =>
  helmet({ xssFilter: true });

// Export default
export default helmet;

// Demo
if (import.meta.main) {
  console.log('=== Elide Helmet Demo ===\n');

  const createMockRes = () => {
    const headers: Record<string, string> = {};
    return {
      headers,
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
      removeHeader: (name: string) => {
        delete headers[name];
      }
    };
  };

  // Example 1: Default helmet
  console.log('1. Default helmet (all protections):');
  const res1 = createMockRes();
  res1.headers['X-Powered-By'] = 'Express';
  const middleware1 = helmet();
  middleware1({}, res1, () => {});
  console.log('   Headers set:', Object.keys(res1.headers).length);
  console.log('   Sample:', {
    'X-Frame-Options': res1.headers['X-Frame-Options'],
    'X-Content-Type-Options': res1.headers['X-Content-Type-Options'],
    'X-XSS-Protection': res1.headers['X-XSS-Protection']
  });
  console.log('');

  // Example 2: Custom CSP
  console.log('2. Custom Content Security Policy:');
  const res2 = createMockRes();
  const middleware2 = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.example.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', '*.example.com']
      }
    }
  });
  middleware2({}, res2, () => {});
  console.log('   CSP:', res2.headers['Content-Security-Policy']);
  console.log('');

  // Example 3: HSTS configuration
  console.log('3. HSTS (HTTP Strict Transport Security):');
  const res3 = createMockRes();
  const middleware3 = helmet({
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  });
  middleware3({}, res3, () => {});
  console.log('   HSTS:', res3.headers['Strict-Transport-Security']);
  console.log('');

  // Example 4: Frameguard
  console.log('4. Frameguard (X-Frame-Options):');
  const res4 = createMockRes();
  const middleware4 = helmet({
    frameguard: { action: 'deny' }
  });
  middleware4({}, res4, () => {});
  console.log('   X-Frame-Options:', res4.headers['X-Frame-Options']);
  console.log('');

  // Example 5: Selective protections
  console.log('5. Selective protections:');
  const res5 = createMockRes();
  const middleware5 = helmet({
    contentSecurityPolicy: false,
    hsts: false,
    noSniff: true,
    xssFilter: true,
    frameguard: true
  });
  middleware5({}, res5, () => {});
  console.log('   Headers:', Object.keys(res5.headers));
  console.log('');

  // Example 6: Individual middleware
  console.log('6. Individual middleware (noSniff):');
  const res6 = createMockRes();
  const middleware6 = noSniff();
  middleware6({}, res6, () => {});
  console.log('   X-Content-Type-Options:', res6.headers['X-Content-Type-Options']);
  console.log('');

  console.log('✓ All examples completed successfully!');
  console.log('\nUse with Express.js:');
  console.log('  app.use(helmet());');
  console.log('  app.use(helmet({ frameguard: { action: "deny" } }));');
}
