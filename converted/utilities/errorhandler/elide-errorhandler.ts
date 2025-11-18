/**
 * errorhandler - Development error handler middleware
 * Based on https://www.npmjs.com/package/errorhandler (~8M+ downloads/week)
 *
 * Features:
 * - Pretty error pages in development
 * - Stack trace display
 * - Error context
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Express-compatible middleware
 */

interface ErrorHandlerOptions {
  log?: boolean | ((err: Error, str: string, req: any) => void);
}

function errorHandler(options: ErrorHandlerOptions = {}) {
  const log = options.log !== false;

  return function errorHandlerMiddleware(
    err: Error,
    req: any,
    res: any,
    next: Function
  ): void {
    const status = (err as any).status || (err as any).statusCode || 500;

    // Log error if enabled
    if (log) {
      const str = `${err.name}: ${err.message}\n${err.stack}`;
      if (typeof options.log === 'function') {
        options.log(err, str, req);
      } else {
        console.error(str);
      }
    }

    // Generate HTML error page
    const html = generateErrorPage(err, status, req);

    // Set response
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  };
}

function generateErrorPage(err: Error, status: number, req: any): string {
  const stack = (err.stack || '')
    .split('\n')
    .map(line => '<div>' + escapeHtml(line) + '</div>')
    .join('');

  const html = '<!DOCTYPE html>\n<html>\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>Error - ' + status + '</title>\n' +
    '<style>\n' +
    'body { font-family: monospace; padding: 20px; background: #f5f5f5; }\n' +
    '.error { background: #fff; padding: 20px; border-left: 4px solid #e74c3c; }\n' +
    'h1 { color: #e74c3c; margin: 0 0 10px 0; }\n' +
    '.message { font-size: 16px; margin: 10px 0; }\n' +
    '.stack { background: #2d2d2d; color: #f8f8f2; padding: 15px; margin-top: 20px; overflow-x: auto; }\n' +
    '.request { margin-top: 20px; background: #fff; padding: 15px; }\n' +
    '</style>\n</head>\n<body>\n' +
    '<div class="error">\n' +
    '<h1>' + status + ' - ' + escapeHtml(err.name) + '</h1>\n' +
    '<div class="message">' + escapeHtml(err.message) + '</div>\n' +
    '<div class="stack">' + stack + '</div>\n' +
    '</div>\n' +
    '<div class="request">\n' +
    '<h3>Request</h3>\n' +
    '<div>' + escapeHtml(req.method || 'GET') + ' ' + escapeHtml(req.url || '/') + '</div>\n' +
    '</div>\n</body>\n</html>';

  return html;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default errorHandler;

// Self-test
if (import.meta.url.includes("elide-errorhandler.ts")) {
  console.log("✅ errorhandler - Dev Error Pages (POLYGLOT!)\n");

  const handler = errorHandler({ log: true });

  const mockReq = { method: 'GET', url: '/api/users' };
  const mockRes = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    end(html: string) {
      this.body = html;
    }
  };

  const error = new Error('Database connection failed');
  (error as any).status = 500;

  handler(error, mockReq, mockRes, () => {});

  console.log('Status:', mockRes.statusCode);
  console.log('Content-Type:', mockRes.headers['Content-Type']);
  console.log('HTML generated:', mockRes.body.length, 'bytes');

  console.log("\n🚀 ~8M+ downloads/week | Express error middleware\n");
}
