/**
 * Logger Middleware
 * Logs request details with minimal overhead
 */

import type { Context } from '../core/context';

export interface LoggerOptions {
  format?: 'minimal' | 'detailed' | 'json';
  colorize?: boolean;
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

export function logger(options: LoggerOptions = {}) {
  const { format = 'minimal', colorize = true } = options;

  return async (ctx: Context, next: () => Promise<any>) => {
    const start = performance.now();
    const method = ctx.method;
    const path = ctx.path;

    try {
      const result = await next();
      const duration = (performance.now() - start).toFixed(2);

      // Determine status code from result
      let status = 200;
      if (result instanceof Response) {
        status = result.status;
      }

      // Log based on format
      if (format === 'json') {
        console.log(JSON.stringify({
          method,
          path,
          status,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        }));
      } else if (format === 'detailed') {
        const statusColor = status >= 500 ? colors.red :
                           status >= 400 ? colors.yellow :
                           status >= 300 ? colors.blue :
                           colors.green;

        const log = colorize
          ? `${colors.gray}[${new Date().toISOString()}]${colors.reset} ${colors.blue}${method}${colors.reset} ${path} ${statusColor}${status}${colors.reset} ${colors.gray}${duration}ms${colors.reset}`
          : `[${new Date().toISOString()}] ${method} ${path} ${status} ${duration}ms`;

        console.log(log);
      } else {
        // Minimal format
        const statusColor = status >= 500 ? colors.red :
                           status >= 400 ? colors.yellow :
                           colors.green;

        const log = colorize
          ? `${colors.blue}${method}${colors.reset} ${path} ${statusColor}${status}${colors.reset} ${colors.gray}${duration}ms${colors.reset}`
          : `${method} ${path} ${status} ${duration}ms`;

        console.log(log);
      }

      return result;
    } catch (error) {
      const duration = (performance.now() - start).toFixed(2);

      if (format === 'json') {
        console.log(JSON.stringify({
          method,
          path,
          status: 500,
          duration: `${duration}ms`,
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        }));
      } else {
        const log = colorize
          ? `${colors.blue}${method}${colors.reset} ${path} ${colors.red}500${colors.reset} ${colors.gray}${duration}ms${colors.reset}`
          : `${method} ${path} 500 ${duration}ms`;

        console.log(log);
      }

      throw error;
    }
  };
}
