/**
 * Logger Middleware
 * Provides request/response logging functionality
 */

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  userAgent?: string;
}

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  log(
    method: string,
    url: string,
    status: number,
    duration: number,
    userAgent?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      duration,
      userAgent,
    };

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging
    const statusColor = this.getStatusColor(status);
    console.log(
      `[${entry.timestamp}] ${method} ${url} - ${statusColor}${status}\x1b[0m - ${duration}ms`
    );
  }

  private getStatusColor(status: number): string {
    if (status >= 500) return '\x1b[31m'; // Red
    if (status >= 400) return '\x1b[33m'; // Yellow
    if (status >= 300) return '\x1b[36m'; // Cyan
    if (status >= 200) return '\x1b[32m'; // Green
    return '\x1b[37m'; // White
  }

  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats(): {
    totalRequests: number;
    averageDuration: number;
    statusCounts: Record<string, number>;
  } {
    const totalRequests = this.logs.length;
    const averageDuration =
      this.logs.reduce((sum, log) => sum + log.duration, 0) / totalRequests || 0;

    const statusCounts: Record<string, number> = {};
    this.logs.forEach((log) => {
      const statusRange = `${Math.floor(log.status / 100)}xx`;
      statusCounts[statusRange] = (statusCounts[statusRange] || 0) + 1;
    });

    return {
      totalRequests,
      averageDuration: Math.round(averageDuration * 100) / 100,
      statusCounts,
    };
  }
}

export const logger = new Logger();

export function logRequest(
  request: Request,
  response: Response,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  const userAgent = request.headers.get('user-agent') || undefined;

  logger.log(
    request.method,
    new URL(request.url).pathname,
    response.status,
    duration,
    userAgent
  );
}
