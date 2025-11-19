/**
 * @elide/helmet - Strict-Transport-Security (HSTS)
 * Force HTTPS connections
 */

export interface HSTSOptions {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

const DEFAULT_MAX_AGE = 15552000; // 180 days in seconds

/**
 * Strict-Transport-Security middleware
 */
export function strictTransportSecurity(options: HSTSOptions = {}) {
  const {
    maxAge = DEFAULT_MAX_AGE,
    includeSubDomains = true,
    preload = false
  } = options;

  const headerValue = buildHSTSHeader(maxAge, includeSubDomains, preload);

  return (req: any, res: any, next: any) => {
    res.setHeader('Strict-Transport-Security', headerValue);
    next();
  };
}

/**
 * Build HSTS header value
 */
function buildHSTSHeader(maxAge: number, includeSubDomains: boolean, preload: boolean): string {
  let value = `max-age=${Math.floor(maxAge)}`;

  if (includeSubDomains) {
    value += '; includeSubDomains';
  }

  if (preload) {
    value += '; preload';
  }

  return value;
}
