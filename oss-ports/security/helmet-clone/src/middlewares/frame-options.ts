/**
 * @elide/helmet - X-Frame-Options
 * Prevent clickjacking attacks
 */

export type FrameOptionsAction = 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';

export interface FrameOptionsOptions {
  action?: FrameOptionsAction;
  domain?: string;
}

/**
 * X-Frame-Options middleware
 */
export function xFrameOptions(options: FrameOptionsOptions = {}) {
  const { action = 'SAMEORIGIN', domain } = options;

  let headerValue: string;

  if (action === 'ALLOW-FROM' && domain) {
    headerValue = `ALLOW-FROM ${domain}`;
  } else {
    headerValue = action;
  }

  return (req: any, res: any, next: any) => {
    res.setHeader('X-Frame-Options', headerValue);
    next();
  };
}

/**
 * Deny framing completely
 */
export function denyFraming() {
  return xFrameOptions({ action: 'DENY' });
}

/**
 * Allow framing from same origin
 */
export function sameOriginFraming() {
  return xFrameOptions({ action: 'SAMEORIGIN' });
}
