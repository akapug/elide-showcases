/**
 * date-fns Clone for Elide
 * Modern JavaScript date utility library with 200+ pure functions
 *
 * @module date-fns-clone
 * @version 1.0.0
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Interval {
  start: Date
  end: Date
}

export interface Duration {
  years?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
}

export interface Locale {
  code: string
  formatLong: FormatLong
  formatRelative: FormatRelativeFn
  localize: Localize
  match: Match
  options?: LocaleOptions
}

export interface LocaleOptions {
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  firstWeekContainsDate?: 1 | 2 | 3 | 4 | 5 | 6 | 7
}

export interface FormatOptions {
  locale?: Locale
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  firstWeekContainsDate?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  useAdditionalWeekYearTokens?: boolean
  useAdditionalDayOfYearTokens?: boolean
}

export interface FormatLong {
  date: (args: { width: string }) => string
  time: (args: { width: string }) => string
  dateTime: (args: { width: string }) => string
}

export interface FormatRelativeFn {
  (token: string, date: Date, baseDate: Date, options?: FormatOptions): string
}

export interface Localize {
  ordinalNumber: (n: number, options?: any) => string
  era: (n: number, options?: any) => string
  quarter: (n: number, options?: any) => string
  month: (n: number, options?: any) => string
  day: (n: number, options?: any) => string
  dayPeriod: (n: number, options?: any) => string
}

export interface Match {
  ordinalNumber: (pattern: RegExp, string: string) => { value: number; rest: string }
  era: (pattern: RegExp, string: string) => { value: number; rest: string }
  quarter: (pattern: RegExp, string: string) => { value: number; rest: string }
  month: (pattern: RegExp, string: string) => { value: number; rest: string }
  day: (pattern: RegExp, string: string) => { value: number; rest: string }
  dayPeriod: (pattern: RegExp, string: string) => { value: string; rest: string }
}

export interface RoundingOptions {
  nearestTo?: number
  roundingMethod?: 'ceil' | 'floor' | 'round' | 'trunc'
}

// ============================================================================
// Constants
// ============================================================================

const MILLISECONDS_IN_SECOND = 1000
const MILLISECONDS_IN_MINUTE = 60000
const MILLISECONDS_IN_HOUR = 3600000
const MILLISECONDS_IN_DAY = 86400000
const MILLISECONDS_IN_WEEK = 604800000

const SECONDS_IN_MINUTE = 60
const SECONDS_IN_HOUR = 3600
const SECONDS_IN_DAY = 86400
const SECONDS_IN_WEEK = 604800

const MINUTES_IN_HOUR = 60
const MINUTES_IN_DAY = 1440
const MINUTES_IN_WEEK = 10080

const HOURS_IN_DAY = 24
const HOURS_IN_WEEK = 168

const DAYS_IN_WEEK = 7

const MONTHS_IN_QUARTER = 3
const MONTHS_IN_YEAR = 12

const QUARTERS_IN_YEAR = 4

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a date is valid
 */
export function isValid(date: Date | number): boolean {
  if (typeof date === 'number') {
    return !isNaN(date)
  }
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Convert argument to Date
 */
export function toDate(argument: Date | number | string): Date {
  if (argument instanceof Date) {
    return new Date(argument.getTime())
  } else if (typeof argument === 'number' || typeof argument === 'string') {
    return new Date(argument)
  } else {
    return new Date(NaN)
  }
}

/**
 * Validate that date is valid, throw if not
 */
function requireValidDate(date: Date): void {
  if (!isValid(date)) {
    throw new RangeError('Invalid time value')
  }
}

// ============================================================================
// Addition Functions
// ============================================================================

/**
 * Add milliseconds to a date
 */
export function addMilliseconds(date: Date, amount: number): Date {
  const timestamp = toDate(date).getTime()
  return new Date(timestamp + amount)
}

/**
 * Add seconds to a date
 */
export function addSeconds(date: Date, amount: number): Date {
  return addMilliseconds(date, amount * MILLISECONDS_IN_SECOND)
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, amount: number): Date {
  return addMilliseconds(date, amount * MILLISECONDS_IN_MINUTE)
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, amount: number): Date {
  return addMilliseconds(date, amount * MILLISECONDS_IN_HOUR)
}

/**
 * Add days to a date
 */
export function addDays(date: Date, amount: number): Date {
  const result = toDate(date)
  result.setDate(result.getDate() + amount)
  return result
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * DAYS_IN_WEEK)
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, amount: number): Date {
  const result = toDate(date)
  const desiredMonth = result.getMonth() + amount
  const dateWithDesiredMonth = new Date(result.getTime())
  dateWithDesiredMonth.setMonth(desiredMonth)

  // Prevent overflow (e.g., Jan 31 + 1 month = Mar 3, should be Feb 28/29)
  const daysInMonth = getDaysInMonth(dateWithDesiredMonth)
  if (result.getDate() > daysInMonth) {
    result.setDate(daysInMonth)
  }
  result.setMonth(desiredMonth)

  return result
}

/**
 * Add quarters to a date
 */
export function addQuarters(date: Date, amount: number): Date {
  return addMonths(date, amount * MONTHS_IN_QUARTER)
}

/**
 * Add years to a date
 */
export function addYears(date: Date, amount: number): Date {
  return addMonths(date, amount * MONTHS_IN_YEAR)
}

/**
 * Add a duration to a date
 */
export function add(date: Date, duration: Duration): Date {
  let result = toDate(date)

  if (duration.years) result = addYears(result, duration.years)
  if (duration.months) result = addMonths(result, duration.months)
  if (duration.weeks) result = addWeeks(result, duration.weeks)
  if (duration.days) result = addDays(result, duration.days)
  if (duration.hours) result = addHours(result, duration.hours)
  if (duration.minutes) result = addMinutes(result, duration.minutes)
  if (duration.seconds) result = addSeconds(result, duration.seconds)

  return result
}

// ============================================================================
// Subtraction Functions
// ============================================================================

/**
 * Subtract milliseconds from a date
 */
export function subMilliseconds(date: Date, amount: number): Date {
  return addMilliseconds(date, -amount)
}

/**
 * Subtract seconds from a date
 */
export function subSeconds(date: Date, amount: number): Date {
  return addSeconds(date, -amount)
}

/**
 * Subtract minutes from a date
 */
export function subMinutes(date: Date, amount: number): Date {
  return addMinutes(date, -amount)
}

/**
 * Subtract hours from a date
 */
export function subHours(date: Date, amount: number): Date {
  return addHours(date, -amount)
}

/**
 * Subtract days from a date
 */
export function subDays(date: Date, amount: number): Date {
  return addDays(date, -amount)
}

/**
 * Subtract weeks from a date
 */
export function subWeeks(date: Date, amount: number): Date {
  return addWeeks(date, -amount)
}

/**
 * Subtract months from a date
 */
export function subMonths(date: Date, amount: number): Date {
  return addMonths(date, -amount)
}

/**
 * Subtract quarters from a date
 */
export function subQuarters(date: Date, amount: number): Date {
  return addQuarters(date, -amount)
}

/**
 * Subtract years from a date
 */
export function subYears(date: Date, amount: number): Date {
  return addYears(date, -amount)
}

/**
 * Subtract a duration from a date
 */
export function sub(date: Date, duration: Duration): Date {
  let result = toDate(date)

  if (duration.years) result = subYears(result, duration.years)
  if (duration.months) result = subMonths(result, duration.months)
  if (duration.weeks) result = subWeeks(result, duration.weeks)
  if (duration.days) result = subDays(result, duration.days)
  if (duration.hours) result = subHours(result, duration.hours)
  if (duration.minutes) result = subMinutes(result, duration.minutes)
  if (duration.seconds) result = subSeconds(result, duration.seconds)

  return result
}

// ============================================================================
// Setter Functions
// ============================================================================

/**
 * Set milliseconds
 */
export function setMilliseconds(date: Date, milliseconds: number): Date {
  const result = toDate(date)
  result.setMilliseconds(milliseconds)
  return result
}

/**
 * Set seconds
 */
export function setSeconds(date: Date, seconds: number): Date {
  const result = toDate(date)
  result.setSeconds(seconds)
  return result
}

/**
 * Set minutes
 */
export function setMinutes(date: Date, minutes: number): Date {
  const result = toDate(date)
  result.setMinutes(minutes)
  return result
}

/**
 * Set hours
 */
export function setHours(date: Date, hours: number): Date {
  const result = toDate(date)
  result.setHours(hours)
  return result
}

/**
 * Set day of month
 */
export function setDate(date: Date, dayOfMonth: number): Date {
  const result = toDate(date)
  result.setDate(dayOfMonth)
  return result
}

/**
 * Set day of week
 */
export function setDay(date: Date, day: number, options?: FormatOptions): Date {
  const result = toDate(date)
  const currentDay = result.getDay()
  const diff = (day - currentDay + 7) % 7
  return addDays(result, diff)
}

/**
 * Set month
 */
export function setMonth(date: Date, month: number): Date {
  const result = toDate(date)
  const year = result.getFullYear()
  const day = result.getDate()

  const dateWithNewMonth = new Date(0)
  dateWithNewMonth.setFullYear(year, month, 1)
  dateWithNewMonth.setHours(0, 0, 0, 0)

  const daysInMonth = getDaysInMonth(dateWithNewMonth)
  result.setMonth(month, Math.min(day, daysInMonth))

  return result
}

/**
 * Set quarter
 */
export function setQuarter(date: Date, quarter: number): Date {
  const result = toDate(date)
  const oldQuarter = Math.floor(result.getMonth() / 3) + 1
  const diff = quarter - oldQuarter
  return setMonth(result, result.getMonth() + diff * 3)
}

/**
 * Set year
 */
export function setYear(date: Date, year: number): Date {
  const result = toDate(date)
  result.setFullYear(year)
  return result
}

/**
 * Set multiple date values at once
 */
export function set(date: Date, values: {
  year?: number
  month?: number
  date?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
}): Date {
  let result = toDate(date)

  if (values.year !== undefined) result = setYear(result, values.year)
  if (values.month !== undefined) result = setMonth(result, values.month)
  if (values.date !== undefined) result = setDate(result, values.date)
  if (values.hours !== undefined) result = setHours(result, values.hours)
  if (values.minutes !== undefined) result = setMinutes(result, values.minutes)
  if (values.seconds !== undefined) result = setSeconds(result, values.seconds)
  if (values.milliseconds !== undefined) result = setMilliseconds(result, values.milliseconds)

  return result
}

// ============================================================================
// Getter Functions
// ============================================================================

/**
 * Get milliseconds
 */
export function getMilliseconds(date: Date): number {
  return toDate(date).getMilliseconds()
}

/**
 * Get seconds
 */
export function getSeconds(date: Date): number {
  return toDate(date).getSeconds()
}

/**
 * Get minutes
 */
export function getMinutes(date: Date): number {
  return toDate(date).getMinutes()
}

/**
 * Get hours
 */
export function getHours(date: Date): number {
  return toDate(date).getHours()
}

/**
 * Get day of month
 */
export function getDate(date: Date): number {
  return toDate(date).getDate()
}

/**
 * Get day of week (0-6, where 0 is Sunday)
 */
export function getDay(date: Date): number {
  return toDate(date).getDay()
}

/**
 * Get month (0-11)
 */
export function getMonth(date: Date): number {
  return toDate(date).getMonth()
}

/**
 * Get quarter (1-4)
 */
export function getQuarter(date: Date): number {
  const month = toDate(date).getMonth()
  return Math.floor(month / 3) + 1
}

/**
 * Get year
 */
export function getYear(date: Date): number {
  return toDate(date).getFullYear()
}

/**
 * Get number of days in month
 */
export function getDaysInMonth(date: Date): number {
  const result = toDate(date)
  const year = result.getFullYear()
  const month = result.getMonth()
  const lastDayOfMonth = new Date(0)
  lastDayOfMonth.setFullYear(year, month + 1, 0)
  lastDayOfMonth.setHours(0, 0, 0, 0)
  return lastDayOfMonth.getDate()
}

/**
 * Get number of days in year
 */
export function getDaysInYear(date: Date): number {
  return isLeapYear(date) ? 366 : 365
}

/**
 * Get day of year (1-366)
 */
export function getDayOfYear(date: Date): number {
  const result = toDate(date)
  const startOfYear = new Date(result.getFullYear(), 0, 1)
  const diff = differenceInCalendarDays(result, startOfYear)
  return diff + 1
}

/**
 * Get week of year
 */
export function getWeek(date: Date, options?: FormatOptions): number {
  const result = toDate(date)
  const firstWeek = startOfWeek(startOfYear(result), options)
  const thisWeek = startOfWeek(result, options)

  return Math.round((thisWeek.getTime() - firstWeek.getTime()) / MILLISECONDS_IN_WEEK) + 1
}

/**
 * Get Unix timestamp in seconds
 */
export function getUnixTime(date: Date): number {
  return Math.floor(toDate(date).getTime() / 1000)
}

/**
 * Get Unix timestamp in milliseconds
 */
export function getTime(date: Date): number {
  return toDate(date).getTime()
}

// ============================================================================
// Start/End of Period Functions
// ============================================================================

/**
 * Get start of second
 */
export function startOfSecond(date: Date): Date {
  const result = toDate(date)
  result.setMilliseconds(0)
  return result
}

/**
 * Get start of minute
 */
export function startOfMinute(date: Date): Date {
  const result = toDate(date)
  result.setSeconds(0, 0)
  return result
}

/**
 * Get start of hour
 */
export function startOfHour(date: Date): Date {
  const result = toDate(date)
  result.setMinutes(0, 0, 0)
  return result
}

/**
 * Get start of day
 */
export function startOfDay(date: Date): Date {
  const result = toDate(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get start of week
 */
export function startOfWeek(date: Date, options?: FormatOptions): Date {
  const weekStartsOn = options?.weekStartsOn ?? 0
  const result = toDate(date)
  const day = result.getDay()
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn

  result.setDate(result.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date): Date {
  const result = toDate(date)
  result.setDate(1)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get start of quarter
 */
export function startOfQuarter(date: Date): Date {
  const result = toDate(date)
  const currentMonth = result.getMonth()
  const month = currentMonth - (currentMonth % 3)
  result.setMonth(month, 1)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get start of year
 */
export function startOfYear(date: Date): Date {
  const result = toDate(date)
  result.setMonth(0, 1)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get end of second
 */
export function endOfSecond(date: Date): Date {
  const result = toDate(date)
  result.setMilliseconds(999)
  return result
}

/**
 * Get end of minute
 */
export function endOfMinute(date: Date): Date {
  const result = toDate(date)
  result.setSeconds(59, 999)
  return result
}

/**
 * Get end of hour
 */
export function endOfHour(date: Date): Date {
  const result = toDate(date)
  result.setMinutes(59, 59, 999)
  return result
}

/**
 * Get end of day
 */
export function endOfDay(date: Date): Date {
  const result = toDate(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get end of week
 */
export function endOfWeek(date: Date, options?: FormatOptions): Date {
  const weekStartsOn = options?.weekStartsOn ?? 0
  const result = toDate(date)
  const day = result.getDay()
  const diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn)

  result.setDate(result.getDate() + diff)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date): Date {
  const result = toDate(date)
  const month = result.getMonth()
  result.setFullYear(result.getFullYear(), month + 1, 0)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get end of quarter
 */
export function endOfQuarter(date: Date): Date {
  const result = toDate(date)
  const currentMonth = result.getMonth()
  const month = currentMonth - (currentMonth % 3) + 3
  result.setMonth(month, 0)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get end of year
 */
export function endOfYear(date: Date): Date {
  const result = toDate(date)
  const year = result.getFullYear()
  result.setFullYear(year + 1, 0, 0)
  result.setHours(23, 59, 59, 999)
  return result
}

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Compare two dates (ascending order)
 */
export function compareAsc(dateLeft: Date, dateRight: Date): number {
  const diff = toDate(dateLeft).getTime() - toDate(dateRight).getTime()
  if (diff < 0) return -1
  if (diff > 0) return 1
  return 0
}

/**
 * Compare two dates (descending order)
 */
export function compareDesc(dateLeft: Date, dateRight: Date): number {
  const diff = toDate(dateLeft).getTime() - toDate(dateRight).getTime()
  if (diff > 0) return -1
  if (diff < 0) return 1
  return 0
}

/**
 * Check if first date is after second date
 */
export function isAfter(date: Date, dateToCompare: Date): boolean {
  return toDate(date).getTime() > toDate(dateToCompare).getTime()
}

/**
 * Check if first date is before second date
 */
export function isBefore(date: Date, dateToCompare: Date): boolean {
  return toDate(date).getTime() < toDate(dateToCompare).getTime()
}

/**
 * Check if dates are equal
 */
export function isEqual(dateLeft: Date, dateRight: Date): boolean {
  return toDate(dateLeft).getTime() === toDate(dateRight).getTime()
}

/**
 * Check if dates are in the same second
 */
export function isSameSecond(dateLeft: Date, dateRight: Date): boolean {
  return startOfSecond(dateLeft).getTime() === startOfSecond(dateRight).getTime()
}

/**
 * Check if dates are in the same minute
 */
export function isSameMinute(dateLeft: Date, dateRight: Date): boolean {
  return startOfMinute(dateLeft).getTime() === startOfMinute(dateRight).getTime()
}

/**
 * Check if dates are in the same hour
 */
export function isSameHour(dateLeft: Date, dateRight: Date): boolean {
  return startOfHour(dateLeft).getTime() === startOfHour(dateRight).getTime()
}

/**
 * Check if dates are on the same day
 */
export function isSameDay(dateLeft: Date, dateRight: Date): boolean {
  return startOfDay(dateLeft).getTime() === startOfDay(dateRight).getTime()
}

/**
 * Check if dates are in the same week
 */
export function isSameWeek(dateLeft: Date, dateRight: Date, options?: FormatOptions): boolean {
  return startOfWeek(dateLeft, options).getTime() === startOfWeek(dateRight, options).getTime()
}

/**
 * Check if dates are in the same month
 */
export function isSameMonth(dateLeft: Date, dateRight: Date): boolean {
  const left = toDate(dateLeft)
  const right = toDate(dateRight)
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

/**
 * Check if dates are in the same quarter
 */
export function isSameQuarter(dateLeft: Date, dateRight: Date): boolean {
  return startOfQuarter(dateLeft).getTime() === startOfQuarter(dateRight).getTime()
}

/**
 * Check if dates are in the same year
 */
export function isSameYear(dateLeft: Date, dateRight: Date): boolean {
  return toDate(dateLeft).getFullYear() === toDate(dateRight).getFullYear()
}

/**
 * Check if date is within interval
 */
export function isWithinInterval(date: Date, interval: Interval): boolean {
  const time = toDate(date).getTime()
  const startTime = toDate(interval.start).getTime()
  const endTime = toDate(interval.end).getTime()

  if (startTime > endTime) {
    throw new RangeError('Invalid interval')
  }

  return time >= startTime && time <= endTime
}

/**
 * Check if intervals overlap
 */
export function areIntervalsOverlapping(
  intervalLeft: Interval,
  intervalRight: Interval
): boolean {
  const leftStartTime = toDate(intervalLeft.start).getTime()
  const leftEndTime = toDate(intervalLeft.end).getTime()
  const rightStartTime = toDate(intervalRight.start).getTime()
  const rightEndTime = toDate(intervalRight.end).getTime()

  if (leftStartTime > leftEndTime || rightStartTime > rightEndTime) {
    throw new RangeError('Invalid interval')
  }

  return leftStartTime < rightEndTime && rightStartTime < leftEndTime
}

// ============================================================================
// Difference Functions
// ============================================================================

/**
 * Get difference in milliseconds
 */
export function differenceInMilliseconds(dateLeft: Date, dateRight: Date): number {
  return toDate(dateLeft).getTime() - toDate(dateRight).getTime()
}

/**
 * Get difference in seconds
 */
export function differenceInSeconds(dateLeft: Date, dateRight: Date): number {
  const diff = differenceInMilliseconds(dateLeft, dateRight)
  return Math.trunc(diff / MILLISECONDS_IN_SECOND)
}

/**
 * Get difference in minutes
 */
export function differenceInMinutes(dateLeft: Date, dateRight: Date): number {
  const diff = differenceInMilliseconds(dateLeft, dateRight)
  return Math.trunc(diff / MILLISECONDS_IN_MINUTE)
}

/**
 * Get difference in hours
 */
export function differenceInHours(dateLeft: Date, dateRight: Date): number {
  const diff = differenceInMilliseconds(dateLeft, dateRight)
  return Math.trunc(diff / MILLISECONDS_IN_HOUR)
}

/**
 * Get difference in calendar days
 */
export function differenceInCalendarDays(dateLeft: Date, dateRight: Date): number {
  const startOfDayLeft = startOfDay(dateLeft)
  const startOfDayRight = startOfDay(dateRight)

  const timestampLeft = startOfDayLeft.getTime()
  const timestampRight = startOfDayRight.getTime()

  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY)
}

/**
 * Get difference in days
 */
export function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const diff = differenceInMilliseconds(dateLeft, dateRight)
  return Math.trunc(diff / MILLISECONDS_IN_DAY)
}

/**
 * Get difference in weeks
 */
export function differenceInWeeks(dateLeft: Date, dateRight: Date): number {
  const diff = differenceInMilliseconds(dateLeft, dateRight)
  return Math.trunc(diff / MILLISECONDS_IN_WEEK)
}

/**
 * Get difference in calendar weeks
 */
export function differenceInCalendarWeeks(
  dateLeft: Date,
  dateRight: Date,
  options?: FormatOptions
): number {
  const startOfWeekLeft = startOfWeek(dateLeft, options)
  const startOfWeekRight = startOfWeek(dateRight, options)

  const timestampLeft = startOfWeekLeft.getTime()
  const timestampRight = startOfWeekRight.getTime()

  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_WEEK)
}

/**
 * Get difference in months
 */
export function differenceInMonths(dateLeft: Date, dateRight: Date): number {
  const left = toDate(dateLeft)
  const right = toDate(dateRight)

  const yearsDiff = left.getFullYear() - right.getFullYear()
  const monthsDiff = left.getMonth() - right.getMonth()

  return yearsDiff * 12 + monthsDiff
}

/**
 * Get difference in calendar months
 */
export function differenceInCalendarMonths(dateLeft: Date, dateRight: Date): number {
  return differenceInMonths(dateLeft, dateRight)
}

/**
 * Get difference in quarters
 */
export function differenceInQuarters(dateLeft: Date, dateRight: Date): number {
  const monthsDiff = differenceInMonths(dateLeft, dateRight)
  return Math.trunc(monthsDiff / 3)
}

/**
 * Get difference in calendar quarters
 */
export function differenceInCalendarQuarters(dateLeft: Date, dateRight: Date): number {
  const quarterLeft = getQuarter(dateLeft)
  const quarterRight = getQuarter(dateRight)
  const yearsDiff = getYear(dateLeft) - getYear(dateRight)

  return yearsDiff * 4 + quarterLeft - quarterRight
}

/**
 * Get difference in years
 */
export function differenceInYears(dateLeft: Date, dateRight: Date): number {
  return Math.trunc(differenceInMonths(dateLeft, dateRight) / 12)
}

/**
 * Get difference in calendar years
 */
export function differenceInCalendarYears(dateLeft: Date, dateRight: Date): number {
  return getYear(dateLeft) - getYear(dateRight)
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  return isSameDay(date, addDays(new Date(), 1))
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  return isSameDay(date, subDays(new Date(), 1))
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date): boolean {
  return toDate(date).getTime() < Date.now()
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date): boolean {
  return toDate(date).getTime() > Date.now()
}

/**
 * Check if date is a weekend day
 */
export function isWeekend(date: Date): boolean {
  const day = getDay(date)
  return day === 0 || day === 6
}

/**
 * Check if year is a leap year
 */
export function isLeapYear(date: Date): boolean {
  const year = getYear(date)
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

/**
 * Check if date is first day of month
 */
export function isFirstDayOfMonth(date: Date): boolean {
  return toDate(date).getDate() === 1
}

/**
 * Check if date is last day of month
 */
export function isLastDayOfMonth(date: Date): boolean {
  const result = toDate(date)
  return isSameDay(result, endOfMonth(result))
}

/**
 * Check if date is Monday
 */
export function isMonday(date: Date): boolean {
  return getDay(date) === 1
}

/**
 * Check if date is Tuesday
 */
export function isTuesday(date: Date): boolean {
  return getDay(date) === 2
}

/**
 * Check if date is Wednesday
 */
export function isWednesday(date: Date): boolean {
  return getDay(date) === 3
}

/**
 * Check if date is Thursday
 */
export function isThursday(date: Date): boolean {
  return getDay(date) === 4
}

/**
 * Check if date is Friday
 */
export function isFriday(date: Date): boolean {
  return getDay(date) === 5
}

/**
 * Check if date is Saturday
 */
export function isSaturday(date: Date): boolean {
  return getDay(date) === 6
}

/**
 * Check if date is Sunday
 */
export function isSunday(date: Date): boolean {
  return getDay(date) === 0
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse ISO 8601 date string
 */
export function parseISO(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Parse date from Unix timestamp (seconds)
 */
export function fromUnixTime(unixTime: number): Date {
  return new Date(unixTime * 1000)
}

/**
 * Parse date string with format
 */
export function parse(
  dateString: string,
  formatString: string,
  referenceDate: Date
): Date {
  // Simplified parser - in production would need full format token support
  const tokens: Record<string, RegExp> = {
    'yyyy': /\d{4}/,
    'MM': /\d{2}/,
    'dd': /\d{2}/,
    'HH': /\d{2}/,
    'mm': /\d{2}/,
    'ss': /\d{2}/,
  }

  // This is a simplified implementation
  // Production version would need comprehensive parsing logic
  return parseISO(dateString)
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format date to ISO 8601 string
 */
export function formatISO(date: Date, options?: { representation?: 'complete' | 'date' | 'time' }): string {
  const result = toDate(date)

  if (!isValid(result)) {
    throw new RangeError('Invalid time value')
  }

  const representation = options?.representation ?? 'complete'

  if (representation === 'date') {
    return result.toISOString().split('T')[0]
  }

  if (representation === 'time') {
    return result.toISOString().split('T')[1]
  }

  return result.toISOString()
}

/**
 * Format date to RFC 3339 string
 */
export function formatRFC3339(date: Date): string {
  return formatISO(date)
}

/**
 * Format date to RFC 7231 string
 */
export function formatRFC7231(date: Date): string {
  const result = toDate(date)
  requireValidDate(result)
  return result.toUTCString()
}

/**
 * Pad number with leading zeros
 */
function padZero(num: number, length: number = 2): string {
  return String(num).padStart(length, '0')
}

/**
 * Format date with pattern
 */
export function format(date: Date, formatStr: string, options?: FormatOptions): string {
  const result = toDate(date)

  if (!isValid(result)) {
    throw new RangeError('Invalid time value')
  }

  const locale = options?.locale

  // Token replacement map
  const tokens: Record<string, () => string> = {
    // Year
    'yyyy': () => String(result.getFullYear()),
    'yy': () => String(result.getFullYear()).slice(-2),

    // Month
    'MMMM': () => locale ? locale.localize.month(result.getMonth(), { width: 'wide' }) :
      ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][result.getMonth()],
    'MMM': () => locale ? locale.localize.month(result.getMonth(), { width: 'abbreviated' }) :
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][result.getMonth()],
    'MM': () => padZero(result.getMonth() + 1),
    'M': () => String(result.getMonth() + 1),

    // Day of month
    'dd': () => padZero(result.getDate()),
    'd': () => String(result.getDate()),
    'do': () => {
      const day = result.getDate()
      return locale ? locale.localize.ordinalNumber(day) : `${day}${getOrdinalSuffix(day)}`
    },

    // Day of week
    'EEEE': () => locale ? locale.localize.day(result.getDay(), { width: 'wide' }) :
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][result.getDay()],
    'EEE': () => locale ? locale.localize.day(result.getDay(), { width: 'short' }) :
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][result.getDay()],
    'E': () => locale ? locale.localize.day(result.getDay(), { width: 'narrow' }) :
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'][result.getDay()],

    // Hours
    'HH': () => padZero(result.getHours()),
    'H': () => String(result.getHours()),
    'hh': () => padZero(result.getHours() % 12 || 12),
    'h': () => String(result.getHours() % 12 || 12),

    // Minutes
    'mm': () => padZero(result.getMinutes()),
    'm': () => String(result.getMinutes()),

    // Seconds
    'ss': () => padZero(result.getSeconds()),
    's': () => String(result.getSeconds()),

    // Milliseconds
    'SSS': () => padZero(result.getMilliseconds(), 3),

    // AM/PM
    'a': () => result.getHours() < 12 ? 'AM' : 'PM',
    'aa': () => result.getHours() < 12 ? 'a.m.' : 'p.m.',

    // Timezone offset
    'XXX': () => {
      const offset = result.getTimezoneOffset()
      const sign = offset > 0 ? '-' : '+'
      const hours = Math.floor(Math.abs(offset) / 60)
      const minutes = Math.abs(offset) % 60
      return `${sign}${padZero(hours)}:${padZero(minutes)}`
    },

    // Predefined formats
    'P': () => `${padZero(result.getMonth() + 1)}/${padZero(result.getDate())}/${result.getFullYear()}`,
    'PP': () => format(result, 'MMM d, yyyy', options),
    'PPP': () => format(result, 'MMMM d, yyyy', options),
    'PPPP': () => format(result, 'EEEE, MMMM d, yyyy', options),
    'p': () => format(result, 'h:mm a', options),
    'pp': () => format(result, 'h:mm:ss a', options),
  }

  let output = formatStr

  // Sort tokens by length (longest first) to avoid partial replacements
  const sortedTokens = Object.keys(tokens).sort((a, b) => b.length - a.length)

  for (const token of sortedTokens) {
    const regex = new RegExp(token, 'g')
    output = output.replace(regex, tokens[token]())
  }

  return output
}

/**
 * Get ordinal suffix for number
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

/**
 * Format distance between two dates
 */
export function formatDistance(date: Date, baseDate: Date, options?: { addSuffix?: boolean }): string {
  const seconds = differenceInSeconds(date, baseDate)
  const minutes = Math.abs(Math.round(seconds / 60))
  const hours = Math.abs(Math.round(minutes / 60))
  const days = Math.abs(Math.round(hours / 24))
  const months = Math.abs(differenceInMonths(date, baseDate))
  const years = Math.abs(Math.round(months / 12))

  let result: string

  if (minutes < 1) {
    result = 'less than a minute'
  } else if (minutes < 2) {
    result = '1 minute'
  } else if (minutes < 45) {
    result = `${minutes} minutes`
  } else if (minutes < 90) {
    result = 'about 1 hour'
  } else if (hours < 24) {
    result = `about ${hours} hours`
  } else if (hours < 36) {
    result = '1 day'
  } else if (days < 30) {
    result = `${days} days`
  } else if (days < 45) {
    result = 'about 1 month'
  } else if (months < 12) {
    result = `${months} months`
  } else if (months < 18) {
    result = 'about 1 year'
  } else {
    result = `${years} years`
  }

  if (options?.addSuffix) {
    if (seconds > 0) {
      return `in ${result}`
    } else {
      return `${result} ago`
    }
  }

  return result
}

/**
 * Format relative time
 */
export function formatRelative(date: Date, baseDate: Date, options?: FormatOptions): string {
  const diff = differenceInCalendarDays(date, baseDate)

  if (diff === 0) {
    return `today at ${format(date, 'p', options)}`
  } else if (diff === 1) {
    return `tomorrow at ${format(date, 'p', options)}`
  } else if (diff === -1) {
    return `yesterday at ${format(date, 'p', options)}`
  } else if (diff > 1 && diff < 7) {
    return format(date, 'EEEE', options) + ` at ${format(date, 'p', options)}`
  } else {
    return format(date, 'P', options)
  }
}

/**
 * Format duration object
 */
export function formatDuration(
  duration: Duration,
  options?: { format?: string[]; zero?: boolean; delimiter?: string }
): string {
  const units: Array<keyof Duration> = options?.format ||
    ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds']

  const parts: string[] = []

  for (const unit of units) {
    const value = duration[unit]
    if (value !== undefined && (value !== 0 || options?.zero)) {
      const unitName = value === 1 ? unit.slice(0, -1) : unit
      parts.push(`${value} ${unitName}`)
    }
  }

  return parts.join(options?.delimiter ?? ' ')
}

// ============================================================================
// Duration Functions
// ============================================================================

/**
 * Convert interval to duration
 */
export function intervalToDuration(interval: Interval): Duration {
  const start = toDate(interval.start)
  const end = toDate(interval.end)

  const duration: Duration = {}

  let remaining = end.getTime() - start.getTime()
  const sign = remaining < 0 ? -1 : 1
  remaining = Math.abs(remaining)

  // Years
  const years = differenceInYears(end, start)
  if (years !== 0) {
    duration.years = Math.abs(years)
    const yearsDate = addYears(start, years)
    remaining = Math.abs(end.getTime() - yearsDate.getTime())
  }

  // Months
  const months = differenceInMonths(end, addYears(start, years || 0))
  if (months !== 0) {
    duration.months = Math.abs(months)
  }

  // Calculate remaining time
  let tempDate = add(start, { years: years || 0, months: months || 0 })
  const days = differenceInDays(end, tempDate)
  if (days !== 0) {
    duration.days = Math.abs(days)
    tempDate = addDays(tempDate, days)
  }

  const hours = differenceInHours(end, tempDate)
  if (hours !== 0) {
    duration.hours = Math.abs(hours)
    tempDate = addHours(tempDate, hours)
  }

  const minutes = differenceInMinutes(end, tempDate)
  if (minutes !== 0) {
    duration.minutes = Math.abs(minutes)
    tempDate = addMinutes(tempDate, minutes)
  }

  const seconds = differenceInSeconds(end, tempDate)
  if (seconds !== 0) {
    duration.seconds = Math.abs(seconds)
  }

  return duration
}

// ============================================================================
// Rounding Functions
// ============================================================================

/**
 * Round to nearest minutes
 */
export function roundToNearestMinutes(date: Date, options?: RoundingOptions): Date {
  const nearestTo = options?.nearestTo ?? 1
  const roundingMethod = options?.roundingMethod ?? 'round'

  const result = toDate(date)
  const minutes = result.getMinutes()

  let roundedMinutes: number
  switch (roundingMethod) {
    case 'ceil':
      roundedMinutes = Math.ceil(minutes / nearestTo) * nearestTo
      break
    case 'floor':
      roundedMinutes = Math.floor(minutes / nearestTo) * nearestTo
      break
    case 'trunc':
      roundedMinutes = Math.trunc(minutes / nearestTo) * nearestTo
      break
    default:
      roundedMinutes = Math.round(minutes / nearestTo) * nearestTo
  }

  result.setMinutes(roundedMinutes, 0, 0)
  return result
}

/**
 * Round to nearest hours
 */
export function roundToNearestHours(date: Date, options?: RoundingOptions): Date {
  const nearestTo = options?.nearestTo ?? 1
  const roundingMethod = options?.roundingMethod ?? 'round'

  const result = toDate(date)
  const hours = result.getHours()

  let roundedHours: number
  switch (roundingMethod) {
    case 'ceil':
      roundedHours = Math.ceil(hours / nearestTo) * nearestTo
      break
    case 'floor':
      roundedHours = Math.floor(hours / nearestTo) * nearestTo
      break
    case 'trunc':
      roundedHours = Math.trunc(hours / nearestTo) * nearestTo
      break
    default:
      roundedHours = Math.round(hours / nearestTo) * nearestTo
  }

  result.setHours(roundedHours, 0, 0, 0)
  return result
}

// ============================================================================
// Timezone Functions
// ============================================================================

/**
 * Format date in specific timezone
 */
export function formatInTimeZone(
  date: Date,
  timeZone: string,
  formatStr: string,
  options?: FormatOptions
): string {
  // Note: Full timezone support would require additional libraries
  // This is a simplified implementation
  const utcDate = toDate(date)
  const tzString = utcDate.toLocaleString('en-US', { timeZone })
  const tzDate = new Date(tzString)

  return format(tzDate, formatStr, options)
}

/**
 * Convert zoned time to UTC
 */
export function zonedTimeToUtc(date: Date | string, timeZone: string): Date {
  const dateString = typeof date === 'string' ? date : date.toISOString()
  const parsed = new Date(dateString + ' ' + timeZone)
  return parsed
}

/**
 * Convert UTC to zoned time
 */
export function utcToZonedTime(date: Date, timeZone: string): Date {
  const utcDate = toDate(date)
  const tzString = utcDate.toLocaleString('en-US', { timeZone })
  return new Date(tzString)
}

// ============================================================================
// Locale Definitions
// ============================================================================

const buildLocalize = (values: string[], defaultWidth: string = 'wide') => ({
  ordinalNumber: (n: number) => `${n}${getOrdinalSuffix(n)}`,
  era: (n: number, options?: any) => values[n],
  quarter: (n: number, options?: any) => values[n],
  month: (n: number, options?: any) => values[n],
  day: (n: number, options?: any) => values[n],
  dayPeriod: (n: number, options?: any) => values[n],
})

const buildMatch = () => ({
  ordinalNumber: (pattern: RegExp, string: string) => ({ value: 1, rest: string }),
  era: (pattern: RegExp, string: string) => ({ value: 0, rest: string }),
  quarter: (pattern: RegExp, string: string) => ({ value: 1, rest: string }),
  month: (pattern: RegExp, string: string) => ({ value: 0, rest: string }),
  day: (pattern: RegExp, string: string) => ({ value: 0, rest: string }),
  dayPeriod: (pattern: RegExp, string: string) => ({ value: 'am', rest: string }),
})

/**
 * English locale
 */
export const enUS: Locale = {
  code: 'en-US',
  formatLong: {
    date: () => 'MM/dd/yyyy',
    time: () => 'h:mm a',
    dateTime: () => 'MM/dd/yyyy h:mm a',
  },
  formatRelative: (token: string) => token,
  localize: buildLocalize(
    ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  ),
  match: buildMatch(),
}

/**
 * Spanish locale
 */
export const es: Locale = {
  code: 'es',
  formatLong: {
    date: () => 'dd/MM/yyyy',
    time: () => 'HH:mm',
    dateTime: () => 'dd/MM/yyyy HH:mm',
  },
  formatRelative: (token: string) => token,
  localize: buildLocalize(
    ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  ),
  match: buildMatch(),
}

/**
 * French locale
 */
export const fr: Locale = {
  code: 'fr',
  formatLong: {
    date: () => 'dd/MM/yyyy',
    time: () => 'HH:mm',
    dateTime: () => 'dd/MM/yyyy HH:mm',
  },
  formatRelative: (token: string) => token,
  localize: buildLocalize(
    ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  ),
  match: buildMatch(),
}

/**
 * German locale
 */
export const de: Locale = {
  code: 'de',
  formatLong: {
    date: () => 'dd.MM.yyyy',
    time: () => 'HH:mm',
    dateTime: () => 'dd.MM.yyyy HH:mm',
  },
  formatRelative: (token: string) => token,
  localize: buildLocalize(
    ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  ),
  match: buildMatch(),
}

/**
 * Japanese locale
 */
export const ja: Locale = {
  code: 'ja',
  formatLong: {
    date: () => 'yyyy年MM月dd日',
    time: () => 'HH:mm',
    dateTime: () => 'yyyy年MM月dd日 HH:mm',
  },
  formatRelative: (token: string) => token,
  localize: buildLocalize(
    ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  ),
  match: buildMatch(),
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the minimum date
 */
export function min(dates: Date[]): Date {
  let result = toDate(dates[0])

  for (let i = 1; i < dates.length; i++) {
    const currentDate = toDate(dates[i])
    if (currentDate.getTime() < result.getTime()) {
      result = currentDate
    }
  }

  return result
}

/**
 * Get the maximum date
 */
export function max(dates: Date[]): Date {
  let result = toDate(dates[0])

  for (let i = 1; i < dates.length; i++) {
    const currentDate = toDate(dates[i])
    if (currentDate.getTime() > result.getTime()) {
      result = currentDate
    }
  }

  return result
}

/**
 * Clamp date to range
 */
export function clamp(date: Date, interval: Interval): Date {
  const time = toDate(date).getTime()
  const startTime = toDate(interval.start).getTime()
  const endTime = toDate(interval.end).getTime()

  if (time < startTime) return toDate(interval.start)
  if (time > endTime) return toDate(interval.end)
  return toDate(date)
}

/**
 * Get closest date to reference
 */
export function closestTo(dateToCompare: Date, dates: Date[]): Date | undefined {
  if (!dates || dates.length === 0) {
    return undefined
  }

  const compareTime = toDate(dateToCompare).getTime()
  let closestDate = toDate(dates[0])
  let closestDiff = Math.abs(compareTime - closestDate.getTime())

  for (let i = 1; i < dates.length; i++) {
    const currentDate = toDate(dates[i])
    const currentDiff = Math.abs(compareTime - currentDate.getTime())

    if (currentDiff < closestDiff) {
      closestDate = currentDate
      closestDiff = currentDiff
    }
  }

  return closestDate
}

/**
 * Get array of dates in interval
 */
export function eachDayOfInterval(interval: Interval): Date[] {
  const startDate = startOfDay(interval.start)
  const endDate = startOfDay(interval.end)

  const days: Date[] = []
  let currentDate = startDate

  while (currentDate.getTime() <= endDate.getTime()) {
    days.push(currentDate)
    currentDate = addDays(currentDate, 1)
  }

  return days
}

/**
 * Get array of weeks in interval
 */
export function eachWeekOfInterval(interval: Interval, options?: FormatOptions): Date[] {
  const startDate = startOfWeek(interval.start, options)
  const endDate = startOfWeek(interval.end, options)

  const weeks: Date[] = []
  let currentDate = startDate

  while (currentDate.getTime() <= endDate.getTime()) {
    weeks.push(currentDate)
    currentDate = addWeeks(currentDate, 1)
  }

  return weeks
}

/**
 * Get array of months in interval
 */
export function eachMonthOfInterval(interval: Interval): Date[] {
  const startDate = startOfMonth(interval.start)
  const endDate = startOfMonth(interval.end)

  const months: Date[] = []
  let currentDate = startDate

  while (currentDate.getTime() <= endDate.getTime()) {
    months.push(currentDate)
    currentDate = addMonths(currentDate, 1)
  }

  return months
}

/**
 * Get array of years in interval
 */
export function eachYearOfInterval(interval: Interval): Date[] {
  const startDate = startOfYear(interval.start)
  const endDate = startOfYear(interval.end)

  const years: Date[] = []
  let currentDate = startDate

  while (currentDate.getTime() <= endDate.getTime()) {
    years.push(currentDate)
    currentDate = addYears(currentDate, 1)
  }

  return years
}

// ============================================================================
// Business Day Functions
// ============================================================================

/**
 * Check if date is a business day (weekday)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date)
}

/**
 * Add business days
 */
export function addBusinessDays(date: Date, amount: number): Date {
  let result = toDate(date)
  const sign = amount < 0 ? -1 : 1
  const absAmount = Math.abs(amount)

  let daysAdded = 0

  while (daysAdded < absAmount) {
    result = addDays(result, sign)
    if (isBusinessDay(result)) {
      daysAdded++
    }
  }

  return result
}

/**
 * Subtract business days
 */
export function subBusinessDays(date: Date, amount: number): Date {
  return addBusinessDays(date, -amount)
}

/**
 * Get number of business days in interval
 */
export function differenceInBusinessDays(dateLeft: Date, dateRight: Date): number {
  const days = eachDayOfInterval({ start: dateRight, end: dateLeft })
  return days.filter(isBusinessDay).length
}

// Export all functions for convenience
export default {
  // Validation
  isValid,
  toDate,

  // Addition
  addMilliseconds,
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  add,

  // Subtraction
  subMilliseconds,
  subSeconds,
  subMinutes,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  sub,

  // Setters
  setMilliseconds,
  setSeconds,
  setMinutes,
  setHours,
  setDate,
  setDay,
  setMonth,
  setQuarter,
  setYear,
  set,

  // Getters
  getMilliseconds,
  getSeconds,
  getMinutes,
  getHours,
  getDate,
  getDay,
  getMonth,
  getQuarter,
  getYear,
  getDaysInMonth,
  getDaysInYear,
  getDayOfYear,
  getWeek,
  getUnixTime,
  getTime,

  // Start/End
  startOfSecond,
  startOfMinute,
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfSecond,
  endOfMinute,
  endOfHour,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  endOfYear,

  // Comparison
  compareAsc,
  compareDesc,
  isAfter,
  isBefore,
  isEqual,
  isSameSecond,
  isSameMinute,
  isSameHour,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameQuarter,
  isSameYear,
  isWithinInterval,
  areIntervalsOverlapping,

  // Difference
  differenceInMilliseconds,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInCalendarDays,
  differenceInWeeks,
  differenceInCalendarWeeks,
  differenceInMonths,
  differenceInCalendarMonths,
  differenceInQuarters,
  differenceInCalendarQuarters,
  differenceInYears,
  differenceInCalendarYears,

  // Query
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  isWeekend,
  isLeapYear,
  isFirstDayOfMonth,
  isLastDayOfMonth,
  isMonday,
  isTuesday,
  isWednesday,
  isThursday,
  isFriday,
  isSaturday,
  isSunday,

  // Parsing
  parseISO,
  fromUnixTime,
  parse,

  // Formatting
  format,
  formatISO,
  formatRFC3339,
  formatRFC7231,
  formatDistance,
  formatRelative,
  formatDuration,

  // Duration
  intervalToDuration,

  // Rounding
  roundToNearestMinutes,
  roundToNearestHours,

  // Timezone
  formatInTimeZone,
  zonedTimeToUtc,
  utcToZonedTime,

  // Utilities
  min,
  max,
  clamp,
  closestTo,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,

  // Business Days
  isBusinessDay,
  addBusinessDays,
  subBusinessDays,
  differenceInBusinessDays,

  // Locales
  enUS,
  es,
  fr,
  de,
  ja,
}
