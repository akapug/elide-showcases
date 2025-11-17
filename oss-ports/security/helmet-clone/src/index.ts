/**
 * @elide/helmet - Production-ready Security Headers
 * Comprehensive security headers middleware for Elide applications
 *
 * @module @elide/helmet
 * @author Elide Security Team
 * @license MIT
 */

// Core middlewares
export { contentSecurityPolicy, generateNonce, cspNonce, strictCSP, type CSPOptions, type CSPDirectives } from './middlewares/content-security-policy';
export { strictTransportSecurity, type HSTSOptions } from './middlewares/hsts';
export { xFrameOptions, denyFraming, sameOriginFraming, type FrameOptionsOptions, type FrameOptionsAction } from './middlewares/frame-options';
export { xssFilter, disableXSSFilter, type XSSFilterOptions } from './middlewares/xss-filter';
export { noSniff } from './middlewares/nosniff';
export { referrerPolicy, strictReferrer, moderateReferrer, type ReferrerPolicyOptions, type ReferrerPolicyValue } from './middlewares/referrer-policy';
export { permissionsPolicy, strictPermissions, type PermissionsPolicyOptions, type PermissionsPolicyDirectives } from './middlewares/permissions-policy';
export { dnsPrefetchControl, type DNSPrefetchControlOptions } from './middlewares/dns-prefetch-control';
export { hidePoweredBy, type HidePoweredByOptions } from './middlewares/hide-powered-by';
export { expectCt, type ExpectCTOptions } from './middlewares/expect-ct';
export {
  crossOriginResourcePolicy,
  crossOriginEmbedderPolicy,
  crossOriginOpenerPolicy,
  type CrossOriginResourcePolicyOptions,
  type CrossOriginEmbedderPolicyOptions,
  type CrossOriginOpenerPolicyOptions
} from './middlewares/cross-origin';

/**
 * Helmet configuration options
 */
export interface HelmetOptions {
  contentSecurityPolicy?: CSPOptions | boolean;
  strictTransportSecurity?: HSTSOptions | boolean;
  xFrameOptions?: FrameOptionsOptions | boolean;
  xssFilter?: XSSFilterOptions | boolean;
  noSniff?: boolean;
  referrerPolicy?: ReferrerPolicyOptions | boolean;
  permissionsPolicy?: PermissionsPolicyOptions | boolean;
  dnsPrefetchControl?: DNSPrefetchControlOptions | boolean;
  hidePoweredBy?: HidePoweredByOptions | boolean;
  expectCt?: ExpectCTOptions | boolean;
  crossOriginResourcePolicy?: CrossOriginResourcePolicyOptions | boolean;
  crossOriginEmbedderPolicy?: CrossOriginEmbedderPolicyOptions | boolean;
  crossOriginOpenerPolicy?: CrossOriginOpenerPolicyOptions | boolean;
}

/**
 * Main Helmet middleware
 * Applies all security headers with sensible defaults
 */
export function helmet(options: HelmetOptions = {}) {
  const middlewares: Array<(req: any, res: any, next: any) => void> = [];

  // Content Security Policy
  if (options.contentSecurityPolicy !== false) {
    const cspOptions = typeof options.contentSecurityPolicy === 'object'
      ? options.contentSecurityPolicy
      : {};
    middlewares.push(contentSecurityPolicy(cspOptions));
  }

  // Strict Transport Security
  if (options.strictTransportSecurity !== false) {
    const hstsOptions = typeof options.strictTransportSecurity === 'object'
      ? options.strictTransportSecurity
      : {};
    middlewares.push(strictTransportSecurity(hstsOptions));
  }

  // X-Frame-Options
  if (options.xFrameOptions !== false) {
    const frameOptions = typeof options.xFrameOptions === 'object'
      ? options.xFrameOptions
      : {};
    middlewares.push(xFrameOptions(frameOptions));
  }

  // X-XSS-Protection
  if (options.xssFilter !== false) {
    const xssOptions = typeof options.xssFilter === 'object'
      ? options.xssFilter
      : {};
    middlewares.push(xssFilter(xssOptions));
  }

  // X-Content-Type-Options
  if (options.noSniff !== false) {
    middlewares.push(noSniff());
  }

  // Referrer-Policy
  if (options.referrerPolicy !== false) {
    const referrerOptions = typeof options.referrerPolicy === 'object'
      ? options.referrerPolicy
      : {};
    middlewares.push(referrerPolicy(referrerOptions));
  }

  // Permissions-Policy
  if (options.permissionsPolicy !== false) {
    const permissionsOptions = typeof options.permissionsPolicy === 'object'
      ? options.permissionsPolicy
      : {};
    middlewares.push(permissionsPolicy(permissionsOptions));
  }

  // DNS Prefetch Control
  if (options.dnsPrefetchControl !== false) {
    const dnsOptions = typeof options.dnsPrefetchControl === 'object'
      ? options.dnsPrefetchControl
      : {};
    middlewares.push(dnsPrefetchControl(dnsOptions));
  }

  // Hide X-Powered-By
  if (options.hidePoweredBy !== false) {
    const poweredByOptions = typeof options.hidePoweredBy === 'object'
      ? options.hidePoweredBy
      : {};
    middlewares.push(hidePoweredBy(poweredByOptions));
  }

  // Expect-CT
  if (options.expectCt) {
    const expectCtOptions = typeof options.expectCt === 'object'
      ? options.expectCt
      : {};
    middlewares.push(expectCt(expectCtOptions));
  }

  // Cross-Origin-Resource-Policy
  if (options.crossOriginResourcePolicy) {
    const corpOptions = typeof options.crossOriginResourcePolicy === 'object'
      ? options.crossOriginResourcePolicy
      : {};
    middlewares.push(crossOriginResourcePolicy(corpOptions));
  }

  // Cross-Origin-Embedder-Policy
  if (options.crossOriginEmbedderPolicy) {
    const coepOptions = typeof options.crossOriginEmbedderPolicy === 'object'
      ? options.crossOriginEmbedderPolicy
      : {};
    middlewares.push(crossOriginEmbedderPolicy(coepOptions));
  }

  // Cross-Origin-Opener-Policy
  if (options.crossOriginOpenerPolicy) {
    const coopOptions = typeof options.crossOriginOpenerPolicy === 'object'
      ? options.crossOriginOpenerPolicy
      : {};
    middlewares.push(crossOriginOpenerPolicy(coopOptions));
  }

  // Return combined middleware
  return (req: any, res: any, next: any) => {
    let index = 0;

    const executeNext = () => {
      if (index >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[index++];
      middleware(req, res, executeNext);
    };

    executeNext();
  };
}

/**
 * Export default helmet function
 */
export default helmet;

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Strict security configuration
 */
export function strictHelmet(): HelmetOptions {
  return {
    contentSecurityPolicy: strictCSP(),
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xFrameOptions: { action: 'DENY' },
    referrerPolicy: { policy: 'no-referrer' },
    permissionsPolicy: strictPermissions(),
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' }
  };
}

/**
 * Moderate security configuration
 */
export function moderateHelmet(): HelmetOptions {
  return {
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    },
    strictTransportSecurity: { maxAge: 15552000, includeSubDomains: true },
    xFrameOptions: { action: 'SAMEORIGIN' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  };
}
