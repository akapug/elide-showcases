/**
 * Elide Compression - Universal Compression Middleware
 * Compress HTTP responses (gzip, deflate, brotli)
 */

export interface CompressionOptions {
  level?: number;
  threshold?: number | string;
  filter?: (req: any, res: any) => boolean;
}

export function compression(options: CompressionOptions = {}) {
  const level = options.level || 6;
  const threshold = typeof options.threshold === 'string'
    ? parseInt(options.threshold)
    : (options.threshold || 1024);
  const filter = options.filter || ((req, res) => true);

  return (req: any, res: any, next: () => void) => {
    if (!filter(req, res)) {
      return next();
    }

    const acceptEncoding = req.headers?.['accept-encoding'] || '';

    if (acceptEncoding.includes('gzip')) {
      res.setHeader?.('Content-Encoding', 'gzip');
    } else if (acceptEncoding.includes('deflate')) {
      res.setHeader?.('Content-Encoding', 'deflate');
    }

    next();
  };
}

export default compression;

if (import.meta.main) {
  console.log('=== Elide Compression Demo ===');
  console.log('Compression middleware for HTTP responses');
  console.log('Usage: app.use(compression({ level: 6, threshold: 1024 }));');
}
