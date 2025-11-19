/**
 * pretty-ms Clone for Elide
 * Convert milliseconds to human-readable strings
 *
 * @module pretty-ms-clone
 * @version 1.0.0
 */

// ============================================================================
// Types
// ============================================================================

export interface Options {
  secondsDecimalDigits?: number
  millisecondsDecimalDigits?: number
  keepDecimalsOnWholeSeconds?: boolean
  compact?: boolean
  verbose?: boolean
  separateMilliseconds?: boolean
  formatSubMilliseconds?: boolean
  colonNotation?: boolean
  unitCount?: number
}

interface ParsedTime {
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
  microseconds?: number
  nanoseconds?: number
}

// ============================================================================
// Constants
// ============================================================================

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

// ============================================================================
// Main Function
// ============================================================================

/**
 * Convert milliseconds to human-readable string
 */
export function prettyMs(milliseconds: number, options: Options = {}): string {
  if (!Number.isFinite(milliseconds)) {
    throw new TypeError('Expected a finite number')
  }

  const {
    secondsDecimalDigits = 1,
    millisecondsDecimalDigits = 0,
    keepDecimalsOnWholeSeconds = false,
    compact = false,
    verbose = false,
    separateMilliseconds = false,
    formatSubMilliseconds = false,
    colonNotation = false,
    unitCount = Infinity,
  } = options

  // Colon notation (1:35:20)
  if (colonNotation) {
    return formatWithColonNotation(milliseconds, secondsDecimalDigits)
  }

  // Parse time components
  const parsed = parseMilliseconds(milliseconds)

  // Format output
  const result: string[] = []
  let count = 0

  const add = (value: number, long: string, short: string, valueString?: string) => {
    if (count >= unitCount) {
      return
    }

    if (value > 0 || (result.length === 0 && count === 0)) {
      count++
      const str = valueString || String(value)
      result.push(verbose ? `${str} ${long}${value === 1 ? '' : 's'}` : str + short)
    }
  }

  const floorDecimals = (value: number, decimals: number): number => {
    const flooredInterimValue = Math.floor(value * 10 ** decimals + 0.0000000001)
    return Math.round(flooredInterimValue) / 10 ** decimals
  }

  const roundDecimals = (value: number, decimals: number): number => {
    return Math.round(value * 10 ** decimals + 0.0000000001) / 10 ** decimals
  }

  // Days
  if (parsed.days) {
    add(parsed.days, 'day', 'd')
  }

  // Hours
  if (parsed.hours) {
    add(parsed.hours, 'hour', 'h')
  }

  // Minutes
  if (parsed.minutes) {
    add(parsed.minutes, 'minute', 'm')
  }

  // Seconds
  if (separateMilliseconds || compact || unitCount === Infinity) {
    const seconds = floorDecimals(parsed.seconds || 0, secondsDecimalDigits)
    const secondsString = keepDecimalsOnWholeSeconds
      ? seconds.toFixed(secondsDecimalDigits)
      : seconds.toString()

    if (seconds !== 0 || result.length === 0) {
      add(seconds, 'second', 's', secondsString)
    }
  } else {
    const seconds = roundDecimals(
      (parsed.seconds || 0) + (parsed.milliseconds || 0) / SECOND,
      secondsDecimalDigits
    )
    const secondsString = keepDecimalsOnWholeSeconds
      ? seconds.toFixed(secondsDecimalDigits)
      : seconds.toString()
    add(seconds, 'second', 's', secondsString)
  }

  // Milliseconds
  if (separateMilliseconds && parsed.milliseconds && count < unitCount) {
    const ms = floorDecimals(parsed.milliseconds, millisecondsDecimalDigits)
    const msString = ms.toFixed(millisecondsDecimalDigits)
    add(ms, 'millisecond', 'ms', msString)
  }

  // Sub-milliseconds
  if (formatSubMilliseconds) {
    if (parsed.microseconds) {
      add(parsed.microseconds, 'microsecond', 'µs')
    }
    if (parsed.nanoseconds) {
      add(parsed.nanoseconds, 'nanosecond', 'ns')
    }
  }

  // If result is empty (0ms case)
  if (result.length === 0) {
    const ms = roundDecimals(milliseconds, millisecondsDecimalDigits)
    return verbose ? `${ms} millisecond${ms === 1 ? '' : 's'}` : `${ms}ms`
  }

  // Join result
  return compact ? result[0] : result.join(' ')
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse milliseconds into time components
 */
function parseMilliseconds(milliseconds: number): ParsedTime {
  const roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil

  return {
    days: roundTowardsZero(milliseconds / DAY),
    hours: roundTowardsZero(milliseconds / HOUR) % 24,
    minutes: roundTowardsZero(milliseconds / MINUTE) % 60,
    seconds: roundTowardsZero(milliseconds / SECOND) % 60,
    milliseconds: roundTowardsZero(milliseconds) % 1000,
    microseconds: roundTowardsZero(milliseconds * 1000) % 1000,
    nanoseconds: roundTowardsZero(milliseconds * 1e6) % 1000,
  }
}

/**
 * Format with colon notation (HH:MM:SS)
 */
function formatWithColonNotation(milliseconds: number, secondsDecimalDigits: number): string {
  const parsed = parseMilliseconds(milliseconds)
  const hours = parsed.days! * 24 + parsed.hours!

  const minutes = parsed.minutes!
  const seconds = (parsed.seconds! + parsed.milliseconds! / SECOND).toFixed(secondsDecimalDigits)

  const parts: string[] = []

  if (hours > 0) {
    parts.push(String(hours))
    parts.push(String(minutes).padStart(2, '0'))
  } else {
    parts.push(String(minutes))
  }

  parts.push(seconds.padStart(secondsDecimalDigits ? secondsDecimalDigits + 3 : 2, '0'))

  return parts.join(':')
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format time ago
 */
export function timeAgo(date: Date | number, now: Date | number = new Date()): string {
  const ms = (typeof date === 'number' ? date : date.getTime()) - (typeof now === 'number' ? now : now.getTime())
  const absMs = Math.abs(ms)

  if (absMs < SECOND) {
    return 'just now'
  }

  const formatted = prettyMs(absMs, { verbose: true, compact: true })

  return ms < 0 ? `${formatted} ago` : `in ${formatted}`
}

/**
 * Format duration
 */
export function formatDuration(start: Date | number, end: Date | number = new Date()): string {
  const ms = (typeof end === 'number' ? end : end.getTime()) - (typeof start === 'number' ? start : start.getTime())
  return prettyMs(Math.abs(ms))
}

/**
 * Format with custom separator
 */
export function formatWithSeparator(milliseconds: number, separator: string = ', '): string {
  const parsed = parseMilliseconds(milliseconds)
  const parts: string[] = []

  if (parsed.days) parts.push(`${parsed.days}d`)
  if (parsed.hours) parts.push(`${parsed.hours}h`)
  if (parsed.minutes) parts.push(`${parsed.minutes}m`)
  if (parsed.seconds) parts.push(`${parsed.seconds}s`)
  if (parsed.milliseconds) parts.push(`${parsed.milliseconds}ms`)

  return parts.join(separator) || '0ms'
}

// ============================================================================
// Export
// ============================================================================

export default prettyMs
export { prettyMs, parseMilliseconds }
