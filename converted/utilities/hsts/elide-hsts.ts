/**
 * hsts - HTTP Strict Transport Security
 * Based on https://www.npmjs.com/package/hsts (~5M downloads/week)
 *
 * Features:
 * - Force HTTPS connections
 * - Prevent protocol downgrade attacks
 * - Include subdomains
 * - Preload support
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface HSTSOptions {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
  setIf?: (req: any) => boolean;
}

const DEFAULT_MAX_AGE = 15552000; // 180 days in seconds

function hsts(options: HSTSOptions = {}) {
  const {
    maxAge = DEFAULT_MAX_AGE,
    includeSubDomains = true,
    preload = false,
    setIf = () => true
  } = options;

  if (typeof maxAge !== 'number' || maxAge < 0) {
    throw new TypeError('HSTS maxAge must be a non-negative number');
  }

  const headerValue = buildHSTSHeader(maxAge, includeSubDomains, preload);

  return function hstsMiddleware(req: any, res: any, next: any) {
    if (setIf(req)) {
      res.setHeader('Strict-Transport-Security', headerValue);
    }
    next();
  };
}

function buildHSTSHeader(maxAge: number, includeSubDomains: boolean, preload: boolean): string {
  let header = `max-age=${maxAge}`;

  if (includeSubDomains) {
    header += '; includeSubDomains';
  }

  if (preload) {
    header += '; preload';
  }

  return header;
}

function getHSTS(options: HSTSOptions = {}): string {
  const {
    maxAge = DEFAULT_MAX_AGE,
    includeSubDomains = true,
    preload = false
  } = options;

  return buildHSTSHeader(maxAge, includeSubDomains, preload);
}

export { hsts, getHSTS, buildHSTSHeader, HSTSOptions };
export default hsts;

if (import.meta.url.includes("elide-hsts.ts")) {
  console.log("✅ hsts - HTTP Strict Transport Security (POLYGLOT!)\n");

  console.log('=== HSTS Headers ===');

  console.log('Default (180 days):');
  console.log(getHSTS());

  console.log('\n1 year with subdomains:');
  console.log(getHSTS({
    maxAge: 31536000,
    includeSubDomains: true
  }));

  console.log('\n2 years with preload:');
  console.log(getHSTS({
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  }));

  console.log('\n90 days without subdomains:');
  console.log(getHSTS({
    maxAge: 7776000,
    includeSubDomains: false
  }));

  console.log('\n=== Recommended Durations ===');
  console.log('Testing: 300 (5 minutes)');
  console.log('Development: 86400 (1 day)');
  console.log('Staging: 2592000 (30 days)');
  console.log('Production: 31536000 (1 year)');
  console.log('Preload: 63072000 (2 years)');

  console.log('\n=== Security Benefits ===');
  console.log('✓ Prevents protocol downgrade attacks');
  console.log('✓ Protects against cookie hijacking');
  console.log('✓ Blocks man-in-the-middle attacks');
  console.log('✓ Enforces HTTPS for all requests');

  console.log('\n=== Middleware Example ===');
  const mockRes = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      console.log(`\nHeader set: ${name}`);
      console.log(`Value: ${value}`);
    }
  };

  const middleware = hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  });

  middleware({}, mockRes, () => {});

  console.log("\n🔒 ~5M downloads/week | Force HTTPS everywhere");
  console.log("🚀 Downgrade protection | Subdomain support | Preload ready\n");
}
