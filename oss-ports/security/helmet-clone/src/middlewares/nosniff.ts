/**
 * @elide/helmet - X-Content-Type-Options
 * Prevent MIME type sniffing
 */

/**
 * X-Content-Type-Options middleware
 */
export function noSniff() {
  return (req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  };
}
