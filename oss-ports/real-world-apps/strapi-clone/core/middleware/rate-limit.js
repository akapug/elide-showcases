/**
 * Rate Limiting Middleware
 * Protects API from abuse
 */

const rateLimitStore = new Map();

export function rateLimitMiddleware(config) {
  if (!config.enabled) {
    return (req, res, next) => next();
  }

  const windowMs = config.windowMs || 60000; // 1 minute
  const max = config.max || 100;
  const message = config.message || 'Too many requests, please try again later';

  return (req, res, next) => {
    const identifier = getIdentifier(req);
    const now = Date.now();

    // Clean old entries
    cleanExpiredEntries(now, windowMs);

    // Get or create rate limit record
    let record = rateLimitStore.get(identifier);

    if (!record) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(identifier, record);
    }

    // Reset if window has expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    // Increment counter
    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    // Check if limit exceeded
    if (record.count > max) {
      res.status(429).json({
        error: {
          status: 429,
          name: 'TooManyRequestsError',
          message,
        },
      });
      return;
    }

    next();
  };
}

function getIdentifier(req) {
  // Use IP address or user ID as identifier
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  const ip = req.headers['x-forwarded-for'] ||
              req.headers['x-real-ip'] ||
              req.connection?.remoteAddress ||
              'unknown';

  return `ip:${ip}`;
}

function cleanExpiredEntries(now, windowMs) {
  // Periodically clean expired entries to prevent memory leak
  if (Math.random() > 0.99) { // Clean 1% of requests
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime + windowMs) {
        rateLimitStore.delete(key);
      }
    }
  }
}
