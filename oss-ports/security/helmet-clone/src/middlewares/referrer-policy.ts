/**
 * @elide/helmet - Referrer-Policy
 * Control referrer information
 */

export type ReferrerPolicyValue =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

export interface ReferrerPolicyOptions {
  policy?: ReferrerPolicyValue | ReferrerPolicyValue[];
}

/**
 * Referrer-Policy middleware
 */
export function referrerPolicy(options: ReferrerPolicyOptions = {}) {
  const { policy = 'no-referrer' } = options;

  const headerValue = Array.isArray(policy) ? policy.join(', ') : policy;

  return (req: any, res: any, next: any) => {
    res.setHeader('Referrer-Policy', headerValue);
    next();
  };
}

/**
 * Strict referrer policy (no referrer)
 */
export function strictReferrer() {
  return referrerPolicy({ policy: 'no-referrer' });
}

/**
 * Moderate referrer policy (same origin)
 */
export function moderateReferrer() {
  return referrerPolicy({ policy: 'strict-origin-when-cross-origin' });
}
