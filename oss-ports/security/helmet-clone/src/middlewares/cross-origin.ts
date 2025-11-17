/**
 * @elide/helmet - Cross-Origin Policies
 * CORP, COEP, COOP headers
 */

export type CrossOriginResourcePolicyValue = 'same-site' | 'same-origin' | 'cross-origin';
export type CrossOriginEmbedderPolicyValue = 'require-corp' | 'credentialless';
export type CrossOriginOpenerPolicyValue = 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';

export interface CrossOriginResourcePolicyOptions {
  policy?: CrossOriginResourcePolicyValue;
}

export interface CrossOriginEmbedderPolicyOptions {
  policy?: CrossOriginEmbedderPolicyValue;
  reportTo?: string;
}

export interface CrossOriginOpenerPolicyOptions {
  policy?: CrossOriginOpenerPolicyValue;
  reportTo?: string;
}

/**
 * Cross-Origin-Resource-Policy middleware
 */
export function crossOriginResourcePolicy(options: CrossOriginResourcePolicyOptions = {}) {
  const { policy = 'same-origin' } = options;

  return (req: any, res: any, next: any) => {
    res.setHeader('Cross-Origin-Resource-Policy', policy);
    next();
  };
}

/**
 * Cross-Origin-Embedder-Policy middleware
 */
export function crossOriginEmbedderPolicy(options: CrossOriginEmbedderPolicyOptions = {}) {
  const { policy = 'require-corp', reportTo } = options;

  let headerValue = policy;

  if (reportTo) {
    headerValue += `; report-to="${reportTo}"`;
  }

  return (req: any, res: any, next: any) => {
    res.setHeader('Cross-Origin-Embedder-Policy', headerValue);
    next();
  };
}

/**
 * Cross-Origin-Opener-Policy middleware
 */
export function crossOriginOpenerPolicy(options: CrossOriginOpenerPolicyOptions = {}) {
  const { policy = 'same-origin', reportTo } = options;

  let headerValue = policy;

  if (reportTo) {
    headerValue += `; report-to="${reportTo}"`;
  }

  return (req: any, res: any, next: any) => {
    res.setHeader('Cross-Origin-Opener-Policy', headerValue);
    next();
  };
}
