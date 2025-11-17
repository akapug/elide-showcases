/**
 * @elide/helmet - X-XSS-Protection
 * Enable XSS filtering in browsers
 */

export interface XSSFilterOptions {
  mode?: 'block' | 'sanitize';
  reportUri?: string;
}

/**
 * X-XSS-Protection middleware
 */
export function xssFilter(options: XSSFilterOptions = {}) {
  const { mode = 'block', reportUri } = options;

  let headerValue = '1';

  if (mode === 'block') {
    headerValue += '; mode=block';
  }

  if (reportUri) {
    headerValue += `; report=${reportUri}`;
  }

  return (req: any, res: any, next: any) => {
    res.setHeader('X-XSS-Protection', headerValue);
    next();
  };
}

/**
 * Disable XSS filter (for CSP-only approach)
 */
export function disableXSSFilter() {
  return (req: any, res: any, next: any) => {
    res.setHeader('X-XSS-Protection', '0');
    next();
  };
}
