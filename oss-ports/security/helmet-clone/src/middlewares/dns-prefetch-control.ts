/**
 * @elide/helmet - X-DNS-Prefetch-Control
 * Control DNS prefetching
 */

export interface DNSPrefetchControlOptions {
  allow?: boolean;
}

/**
 * X-DNS-Prefetch-Control middleware
 */
export function dnsPrefetchControl(options: DNSPrefetchControlOptions = {}) {
  const { allow = false } = options;

  const headerValue = allow ? 'on' : 'off';

  return (req: any, res: any, next: any) => {
    res.setHeader('X-DNS-Prefetch-Control', headerValue);
    next();
  };
}
