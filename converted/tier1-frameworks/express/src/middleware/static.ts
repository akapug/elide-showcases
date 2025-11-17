/**
 * Static File Server Middleware
 *
 * Serves static files from a directory
 */

import { Request } from '../request';
import { Response } from '../response';
import { NextFunction } from '../application';
import * as path from 'path';
import * as fs from 'fs';

export interface StaticOptions {
  dotfiles?: 'allow' | 'deny' | 'ignore';
  etag?: boolean;
  extensions?: string[] | false;
  index?: string[] | string | false;
  maxAge?: number | string;
  redirect?: boolean;
  setHeaders?: (res: Response, path: string, stat: fs.Stats) => void;
}

/**
 * Create static file server middleware
 */
export default function serveStatic(root: string, options: StaticOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    dotfiles = 'ignore',
    etag = true,
    extensions = false,
    index = ['index.html'],
    maxAge = 0,
    redirect = true,
    setHeaders
  } = options;

  // Resolve root path
  const rootPath = path.resolve(root);

  return function staticMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Only handle GET and HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    // Get file path
    let filepath = decodeURIComponent(req.path);

    // Remove leading slash
    if (filepath.startsWith('/')) {
      filepath = filepath.slice(1);
    }

    // Build full path
    let fullPath = path.join(rootPath, filepath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(rootPath)) {
      return next();
    }

    // Check if file exists
    fs.stat(fullPath, (err, stats) => {
      if (err) {
        // Try with extensions if specified
        if (extensions && Array.isArray(extensions)) {
          return tryExtensions(fullPath, extensions, 0);
        }
        return next();
      }

      // If directory, try index files
      if (stats.isDirectory()) {
        // Redirect to trailing slash if needed
        if (redirect && !req.path.endsWith('/')) {
          return res.redirect(301, req.path + '/');
        }

        if (index) {
          const indexFiles = Array.isArray(index) ? index : [index];
          return tryIndex(fullPath, indexFiles, 0);
        }

        return next();
      }

      // Check dotfiles
      const basename = path.basename(fullPath);
      if (basename.startsWith('.')) {
        if (dotfiles === 'deny') {
          return res.status(403).send('Forbidden');
        } else if (dotfiles === 'ignore') {
          return next();
        }
      }

      // Send file
      sendFile(fullPath, stats);
    });

    /**
     * Try index files
     */
    function tryIndex(dir: string, files: string[], i: number): void {
      if (i >= files.length) {
        return next();
      }

      const indexPath = path.join(dir, files[i]);

      fs.stat(indexPath, (err, stats) => {
        if (err || !stats.isFile()) {
          return tryIndex(dir, files, i + 1);
        }

        sendFile(indexPath, stats);
      });
    }

    /**
     * Try extensions
     */
    function tryExtensions(file: string, exts: string[], i: number): void {
      if (i >= exts.length) {
        return next();
      }

      const testPath = file + '.' + exts[i];

      fs.stat(testPath, (err, stats) => {
        if (err || !stats.isFile()) {
          return tryExtensions(file, exts, i + 1);
        }

        sendFile(testPath, stats);
      });
    }

    /**
     * Send file to client
     */
    function sendFile(filepath: string, stats: fs.Stats): void {
      // Set headers
      if (!res.get('Content-Type')) {
        res.type(path.extname(filepath));
      }

      res.setHeader('Content-Length', stats.size);

      // Set cache headers
      if (maxAge) {
        const age = typeof maxAge === 'string' ? parseMaxAge(maxAge) : maxAge;
        res.setHeader('Cache-Control', `public, max-age=${age}`);
      }

      // Set ETag
      if (etag) {
        res.setHeader('ETag', `"${stats.size}-${stats.mtime.getTime()}"`);
      }

      // Call setHeaders callback
      if (setHeaders) {
        setHeaders(res, filepath, stats);
      }

      // Stream file
      const stream = fs.createReadStream(filepath);

      stream.on('error', (err) => {
        next(err);
      });

      stream.pipe(res.res);
    }
  };
}

/**
 * Parse max-age string to seconds
 */
function parseMaxAge(maxAge: string): number {
  const units: { [key: string]: number } = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400,
    'w': 604800,
    'y': 31536000
  };

  const match = maxAge.toLowerCase().match(/^(\d+)\s*([a-z])?$/);

  if (!match) {
    return 0;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] || 's';

  return value * (units[unit] || 1);
}
