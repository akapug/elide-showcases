/**
 * MS - Time duration utilities for API Gateway
 *
 * Re-exports ms functionality from the conversions directory.
 * Used for timeouts, rate limiting, and cache expiration across all services.
 */

// Import from conversions directory
import ms from '../../../conversions/ms/elide-ms.ts';
export default ms;

/**
 * Common timeout durations for API operations
 */
export const TIMEOUTS = {
  API_REQUEST: ms('30s')!,
  DATABASE_QUERY: ms('10s')!,
  CACHE_LOOKUP: ms('1s')!,
  EXTERNAL_API: ms('60s')!,
  HEALTH_CHECK: ms('5s')!,
  AUTH_TOKEN: ms('15m')!,
  SESSION: ms('1h')!,
  REFRESH_TOKEN: ms('7d')!,
};

/**
 * Rate limiting windows
 */
export const RATE_LIMITS = {
  PER_SECOND: ms('1s')!,
  PER_MINUTE: ms('1m')!,
  PER_HOUR: ms('1h')!,
  PER_DAY: ms('1d')!,
};

/**
 * Cache TTLs
 */
export const CACHE_TTL = {
  SHORT: ms('5m')!,
  MEDIUM: ms('30m')!,
  LONG: ms('2h')!,
  VERY_LONG: ms('24h')!,
};

/**
 * Parse timeout from config string
 */
export function parseTimeout(timeout: string): number {
  const result = ms(timeout);
  if (typeof result !== 'number') {
    throw new Error(`Invalid timeout format: ${timeout}`);
  }
  return result;
}

/**
 * Format duration for logging
 */
export function formatDuration(durationMs: number, long: boolean = false): string {
  const result = ms(durationMs, { long });
  return typeof result === 'string' ? result : `${durationMs}ms`;
}
