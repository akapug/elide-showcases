/**
 * @elide/helmet - Content Security Policy
 * Comprehensive CSP header management
 */

export interface CSPDirectives {
  'default-src'?: string[];
  'base-uri'?: string[];
  'child-src'?: string[];
  'connect-src'?: string[];
  'font-src'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'frame-src'?: string[];
  'img-src'?: string[];
  'manifest-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'prefetch-src'?: string[];
  'script-src'?: string[];
  'script-src-attr'?: string[];
  'script-src-elem'?: string[];
  'style-src'?: string[];
  'style-src-attr'?: string[];
  'style-src-elem'?: string[];
  'worker-src'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
  'plugin-types'?: string[];
  'sandbox'?: string[];
  'require-trusted-types-for'?: string[];
  'trusted-types'?: string[];
  'report-uri'?: string[];
  'report-to'?: string;
  [key: string]: any;
}

export interface CSPOptions {
  directives?: CSPDirectives;
  reportOnly?: boolean;
  useDefaults?: boolean;
}

const DEFAULT_DIRECTIVES: CSPDirectives = {
  'default-src': ["'self'"],
  'base-uri': ["'self'"],
  'font-src': ["'self'", 'https:', 'data:'],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'object-src': ["'none'"],
  'script-src': ["'self'"],
  'script-src-attr': ["'none'"],
  'style-src': ["'self'", 'https:', "'unsafe-inline'"],
  'upgrade-insecure-requests': true
};

/**
 * Content Security Policy middleware
 */
export function contentSecurityPolicy(options: CSPOptions = {}) {
  const { directives = {}, reportOnly = false, useDefaults = true } = options;

  const finalDirectives = useDefaults
    ? { ...DEFAULT_DIRECTIVES, ...directives }
    : directives;

  const headerName = reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  const headerValue = buildCSPHeader(finalDirectives);

  return (req: any, res: any, next: any) => {
    res.setHeader(headerName, headerValue);
    next();
  };
}

/**
 * Build CSP header value from directives
 */
function buildCSPHeader(directives: CSPDirectives): string {
  const parts: string[] = [];

  for (const [directive, value] of Object.entries(directives)) {
    if (value === undefined || value === null) {
      continue;
    }

    // Boolean directives
    if (typeof value === 'boolean') {
      if (value) {
        parts.push(directive);
      }
      continue;
    }

    // String value
    if (typeof value === 'string') {
      parts.push(`${directive} ${value}`);
      continue;
    }

    // Array value
    if (Array.isArray(value) && value.length > 0) {
      parts.push(`${directive} ${value.join(' ')}`);
      continue;
    }
  }

  return parts.join('; ');
}

/**
 * Generate nonce for inline scripts/styles
 */
export function generateNonce(): string {
  return Buffer.from(Math.random().toString()).toString('base64').substring(0, 16);
}

/**
 * CSP nonce middleware
 */
export function cspNonce() {
  return (req: any, res: any, next: any) => {
    const nonce = generateNonce();
    res.locals = res.locals || {};
    res.locals.cspNonce = nonce;

    // Add nonce to CSP header if it exists
    const cspHeader = res.getHeader('Content-Security-Policy');
    if (cspHeader) {
      const withNonce = (cspHeader as string).replace(
        /script-src ([^;]*)/,
        `script-src $1 'nonce-${nonce}'`
      );
      res.setHeader('Content-Security-Policy', withNonce);
    }

    next();
  };
}

/**
 * Strict CSP configuration
 */
export function strictCSP(): CSPOptions {
  return {
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'data:'],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true
    }
  };
}
