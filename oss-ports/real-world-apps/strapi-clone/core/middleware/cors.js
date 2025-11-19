/**
 * CORS Middleware
 * Cross-Origin Resource Sharing configuration
 */

export function corsMiddleware(config) {
  return (req, res, next) => {
    if (!config.enabled) {
      return next();
    }

    const origin = req.headers.origin;
    const allowedOrigins = config.origin || ['*'];

    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);

    if (isAllowed) {
      if (allowedOrigins.includes('*')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      } else {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      if (config.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      const allowedMethods = config.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
      res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));

      const allowedHeaders = config.headers || [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
      ];
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));

      if (config.exposedHeaders) {
        res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
      }

      if (config.maxAge) {
        res.setHeader('Access-Control-Max-Age', config.maxAge);
      }
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}
