/**
 * content-security-policy - CSP Header Builder
 * Based on https://www.npmjs.com/package/content-security-policy (~1M downloads/week)
 *
 * Features:
 * - Build Content-Security-Policy headers
 * - Prevent XSS and data injection attacks
 * - Report-only mode for testing
 * - Nonce and hash support
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'worker-src'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'report-uri'?: string[];
  'report-to'?: string[];
  [key: string]: string[] | undefined;
}

interface CSPOptions {
  directives?: CSPDirectives;
  reportOnly?: boolean;
}

function contentSecurityPolicy(options: CSPOptions = {}) {
  const { directives = {}, reportOnly = false } = options;

  // Default directives if none provided
  const defaultDirectives: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'"],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  };

  const policy = { ...defaultDirectives, ...directives };

  return function cspMiddleware(req: any, res: any, next: any) {
    const header = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    res.setHeader(header, buildCSP(policy));
    next();
  };
}

function buildCSP(directives: CSPDirectives): string {
  return Object.entries(directives)
    .filter(([_, values]) => values && values.length > 0)
    .map(([directive, values]) => `${directive} ${values!.join(' ')}`)
    .join('; ');
}

function getCSP(directives: CSPDirectives): string {
  return buildCSP(directives);
}

export { contentSecurityPolicy, getCSP, buildCSP, CSPDirectives, CSPOptions };
export default contentSecurityPolicy;

if (import.meta.url.includes("elide-content-security-policy.ts")) {
  console.log("✅ content-security-policy - CSP Header Builder (POLYGLOT!)\n");

  console.log('=== Default CSP ===');
  const defaultCSP = getCSP({
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'object-src': ["'none'"]
  });
  console.log(defaultCSP);

  console.log('\n=== Strict CSP ===');
  const strictCSP = getCSP({
    'default-src': ["'none'"],
    'script-src': ["'self'", "'strict-dynamic'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"]
  });
  console.log(strictCSP);

  console.log('\n=== CDN-Friendly CSP ===');
  const cdnCSP = getCSP({
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://cdn.example.com', "'unsafe-inline'"],
    'style-src': ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://api.example.com']
  });
  console.log(cdnCSP);

  console.log('\n=== Report-Only Mode ===');
  const reportCSP = getCSP({
    'default-src': ["'self'"],
    'report-uri': ['/csp-violation-report']
  });
  console.log('Header: Content-Security-Policy-Report-Only');
  console.log(reportCSP);

  console.log("\n🔒 ~1M downloads/week | XSS & injection protection");
  console.log("🚀 Flexible directives | Report-only mode | Nonce support\n");
}
