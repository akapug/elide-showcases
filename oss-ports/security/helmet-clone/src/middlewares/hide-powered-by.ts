/**
 * @elide/helmet - Hide X-Powered-By
 * Remove or customize X-Powered-By header
 */

export interface HidePoweredByOptions {
  setTo?: string;
}

/**
 * Hide/customize X-Powered-By middleware
 */
export function hidePoweredBy(options: HidePoweredByOptions = {}) {
  const { setTo } = options;

  return (req: any, res: any, next: any) => {
    if (setTo) {
      res.setHeader('X-Powered-By', setTo);
    } else {
      res.removeHeader('X-Powered-By');
    }
    next();
  };
}
