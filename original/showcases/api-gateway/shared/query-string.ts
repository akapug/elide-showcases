/**
 * Query String - URL query parameter utilities for API Gateway
 *
 * Re-exports query-string functionality from the conversions directory.
 * Used for parsing and stringifying URL parameters across all services.
 */

// Import from conversions directory
import { parse, stringify } from '../../../conversions/query-string/elide-query-string.ts';
export { parse, stringify };

/**
 * Parse URL query parameters
 */
export function parseQuery(url: string): Record<string, any> {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return {};
  return parse(url.substring(queryStart + 1));
}

/**
 * Build query string from object
 */
export function buildQuery(params: Record<string, any>): string {
  return stringify(params);
}

/**
 * Add query parameters to URL
 */
export function addQueryParams(url: string, params: Record<string, any>): string {
  const query = buildQuery(params);
  if (!query) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${query}`;
}

/**
 * Extract pagination parameters
 */
export function extractPagination(queryParams: Record<string, any>): { page: number; limit: number } {
  const page = parseInt(queryParams.page || '1', 10);
  const limit = parseInt(queryParams.limit || '20', 10);
  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit))
  };
}

/**
 * Extract sorting parameters
 */
export function extractSorting(queryParams: Record<string, any>): { field: string; order: 'asc' | 'desc' } | null {
  const sortBy = queryParams.sortBy || queryParams.sort;
  if (!sortBy) return null;

  const order = (queryParams.order || 'asc').toLowerCase();
  return {
    field: sortBy,
    order: order === 'desc' ? 'desc' : 'asc'
  };
}
