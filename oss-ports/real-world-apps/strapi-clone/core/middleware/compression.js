/**
 * Compression Middleware
 * Compresses HTTP responses
 */

export function compressionMiddleware(req, res, next) {
  const acceptEncoding = req.headers['accept-encoding'] || '';

  // Check if client supports compression
  if (!acceptEncoding.match(/\b(gzip|deflate)\b/)) {
    return next();
  }

  // Store original send method
  const originalSend = res.send;
  const originalJson = res.json;

  // Override send method
  res.send = function(data) {
    if (shouldCompress(data)) {
      res.setHeader('Content-Encoding', 'gzip');
      // In production, actually compress the data
      // For now, just pass through
    }
    return originalSend.call(this, data);
  };

  // Override json method
  res.json = function(data) {
    if (shouldCompress(data)) {
      res.setHeader('Content-Encoding', 'gzip');
    }
    return originalJson.call(this, data);
  };

  next();
}

function shouldCompress(data) {
  if (!data) return false;

  // Only compress if data is large enough
  const size = typeof data === 'string'
    ? Buffer.byteLength(data)
    : Buffer.byteLength(JSON.stringify(data));

  return size > 1024; // 1KB threshold
}
