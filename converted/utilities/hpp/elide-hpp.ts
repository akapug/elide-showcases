/**
 * hpp - HTTP Parameter Pollution Protection
 * Based on https://www.npmjs.com/package/hpp (~3M downloads/week)
 *
 * Features:
 * - Prevent HTTP parameter pollution attacks
 * - Whitelist parameter arrays
 * - Protect query string and body parameters
 * - Express/Connect middleware compatible
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface HppOptions {
  whitelist?: string[];
  checkBody?: boolean;
  checkQuery?: boolean;
}

function hpp(options: HppOptions = {}) {
  const { whitelist = [], checkBody = true, checkQuery = true } = options;

  return function hppMiddleware(req: any, res: any, next: any) {
    // Clean query parameters
    if (checkQuery && req.query) {
      req.query = cleanParams(req.query, whitelist);
    }

    // Clean body parameters
    if (checkBody && req.body) {
      req.body = cleanParams(req.body, whitelist);
    }

    next();
  };
}

function cleanParams(params: any, whitelist: string[]): any {
  const cleaned: any = {};

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      // If whitelisted, keep array; otherwise take last value
      cleaned[key] = whitelist.includes(key) ? value : value[value.length - 1];
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function sanitizeParams(params: Record<string, any>, options: HppOptions = {}): Record<string, any> {
  const { whitelist = [] } = options;
  return cleanParams(params, whitelist);
}

export { hpp, sanitizeParams, HppOptions };
export default hpp;

if (import.meta.url.includes("elide-hpp.ts")) {
  console.log("✅ hpp - HTTP Parameter Pollution Protection (POLYGLOT!)\n");

  const pollutedParams = {
    id: '123',
    sort: ['name', 'date', 'malicious'],
    filter: ['a', 'b'],
    page: '1'
  };

  console.log('Original params:', pollutedParams);
  console.log('Sanitized (no whitelist):', sanitizeParams(pollutedParams));
  console.log('Sanitized (filter whitelisted):', sanitizeParams(pollutedParams, {
    whitelist: ['filter']
  }));

  console.log('\n--- Attack Prevention ---');
  const attackParams = {
    userId: ['1', '2 OR 1=1'],
    action: ['delete', 'view']
  };
  console.log('Attack attempt:', attackParams);
  console.log('Protected:', sanitizeParams(attackParams));

  console.log("\n🔒 ~3M downloads/week | HPP attack prevention");
  console.log("🚀 Parameter deduplication | Whitelist support | Express middleware\n");
}
