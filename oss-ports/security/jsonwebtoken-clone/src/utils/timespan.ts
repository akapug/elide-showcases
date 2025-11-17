/**
 * @elide/jsonwebtoken - Timespan Utilities
 * Parse time strings to seconds
 */

import { TimeSpan, JsonWebTokenError } from '../types';

const TIME_UNITS: Record<string, number> = {
  ms: 0.001,
  s: 1,
  sec: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hour: 3600,
  hours: 3600,
  d: 86400,
  day: 86400,
  days: 86400,
  w: 604800,
  week: 604800,
  weeks: 604800,
  y: 31557600,
  year: 31557600,
  years: 31557600
};

/**
 * Parse timespan to seconds
 * @param timespan - Time span string or number
 * @param label - Label for error messages
 */
export function parseTimespan(timespan: TimeSpan, label: string = 'timespan'): number {
  // If it's a number, return as-is (assumed to be seconds)
  if (typeof timespan === 'number') {
    return timespan;
  }

  // If it's a string, parse it
  if (typeof timespan === 'string') {
    const match = timespan.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/i);

    if (!match) {
      throw new JsonWebTokenError(`Invalid ${label} format: ${timespan}`);
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] || 's').toLowerCase();

    if (!TIME_UNITS[unit]) {
      throw new JsonWebTokenError(`Invalid ${label} unit: ${unit}`);
    }

    return value * TIME_UNITS[unit];
  }

  throw new JsonWebTokenError(`Invalid ${label} type`);
}

/**
 * Format seconds to human-readable string
 * @param seconds - Seconds
 */
export function formatTimespan(seconds: number): string {
  const units: Array<[string, number]> = [
    ['year', 31557600],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ];

  for (const [name, value] of units) {
    if (seconds >= value) {
      const count = Math.floor(seconds / value);
      return `${count} ${name}${count !== 1 ? 's' : ''}`;
    }
  }

  return '0 seconds';
}

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check if timestamp is expired
 */
export function isExpired(exp: number, clockTolerance: number = 0): boolean {
  const now = getCurrentTimestamp();
  return now >= exp + clockTolerance;
}

/**
 * Check if timestamp is not yet valid
 */
export function isNotYetValid(nbf: number, clockTolerance: number = 0): boolean {
  const now = getCurrentTimestamp();
  return now < nbf - clockTolerance;
}
