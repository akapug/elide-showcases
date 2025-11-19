/**
 * ms Clone for Elide
 * Convert time strings to milliseconds and vice versa
 *
 * @module ms-clone
 * @version 1.0.0
 */

// ============================================================================
// Types
// ============================================================================

export interface Options {
  long?: boolean
}

export type StringValue =
  | `${number}`
  | `${number}ms`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | `${number}w`
  | `${number}y`

// ============================================================================
// Constants
// ============================================================================

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const WEEK = DAY * 7
const YEAR = DAY * 365.25

// ============================================================================
// Parsing Regex
// ============================================================================

const parseRegex = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i

// ============================================================================
// Main Function
// ============================================================================

/**
 * Convert time string to milliseconds or milliseconds to string
 */
function ms(value: string, options?: Options): number
function ms(value: number, options?: Options): string
function ms(value: string | number, options?: Options): number | string {
  if (typeof value === 'string' && value.length > 0) {
    return parse(value)
  } else if (typeof value === 'number' && isFinite(value)) {
    return format(value, options)
  }

  throw new Error(
    `val is not a non-empty string or a valid number. val=${JSON.stringify(value)}`
  )
}

// ============================================================================
// String to Milliseconds
// ============================================================================

/**
 * Parse time string to milliseconds
 */
function parse(str: string): number {
  str = String(str)

  if (str.length > 100) {
    throw new Error('String exceeds maximum length of 100 characters')
  }

  const match = parseRegex.exec(str)

  if (!match) {
    throw new Error(`Invalid time string: ${str}`)
  }

  const n = parseFloat(match[1])
  const type = (match[2] || 'ms').toLowerCase()

  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * YEAR
    case 'weeks':
    case 'week':
    case 'w':
      return n * WEEK
    case 'days':
    case 'day':
    case 'd':
      return n * DAY
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * HOUR
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * MINUTE
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * SECOND
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n
    default:
      throw new Error(`Unknown unit: ${type}`)
  }
}

// ============================================================================
// Milliseconds to String
// ============================================================================

/**
 * Format milliseconds to time string
 */
function format(ms: number, options: Options = {}): string {
  const long = options.long ?? false
  const absMs = Math.abs(ms)

  if (absMs >= DAY) {
    return fmtLong(ms, absMs, DAY, 'day', long)
  }

  if (absMs >= HOUR) {
    return fmtLong(ms, absMs, HOUR, 'hour', long)
  }

  if (absMs >= MINUTE) {
    return fmtLong(ms, absMs, MINUTE, 'minute', long)
  }

  if (absMs >= SECOND) {
    return fmtLong(ms, absMs, SECOND, 'second', long)
  }

  return fmtLong(ms, absMs, 1, 'millisecond', long)
}

/**
 * Format helper
 */
function fmtLong(ms: number, absMs: number, unit: number, name: string, long: boolean): string {
  const isPlural = absMs >= unit * 1.5

  if (long) {
    return `${Math.round(ms / unit)} ${name}${isPlural ? 's' : ''}`
  }

  // Short format
  const shortNames: Record<string, string> = {
    'millisecond': 'ms',
    'second': 's',
    'minute': 'm',
    'hour': 'h',
    'day': 'd',
    'week': 'w',
    'year': 'y',
  }

  return `${Math.round(ms / unit)}${shortNames[name] || name}`
}

// ============================================================================
// Export
// ============================================================================

export default ms
export { ms, parse, format }
