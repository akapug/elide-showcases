/**
 * Day.js Clone for Elide
 * Lightweight date library with Moment.js-compatible API
 *
 * @module dayjs-clone
 * @version 1.0.0
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export type UnitType = 'year' | 'month' | 'date' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'
export type UnitTypeLong = 'years' | 'months' | 'dates' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
export type OpUnitType = UnitType | 'week' | 'weeks' | 'quarter' | 'quarters' | UnitTypeLong
export type ManipulateType = Exclude<OpUnitType, 'date' | 'dates'>

export interface ConfigType {
  date?: Date | string | number
  format?: string
  locale?: string
  utc?: boolean
}

export interface DayjsObject {
  years: number
  months: number
  date: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export interface Plugin {
  (option: any, dayjsClass: typeof Dayjs, dayjsFactory: typeof dayjs): void
}

export interface Locale {
  name: string
  weekdays?: string[]
  weekdaysShort?: string[]
  weekdaysMin?: string[]
  months?: string[]
  monthsShort?: string[]
  ordinal?: (n: number) => string
  formats?: {
    LT?: string
    LTS?: string
    L?: string
    LL?: string
    LLL?: string
    LLLL?: string
  }
  relativeTime?: {
    future?: string
    past?: string
    s?: string
    m?: string
    mm?: string
    h?: string
    hh?: string
    d?: string
    dd?: string
    M?: string
    MM?: string
    y?: string
    yy?: string
  }
}

// ============================================================================
// Constants
// ============================================================================

const MILLISECONDS_A_SECOND = 1000
const MILLISECONDS_A_MINUTE = 60000
const MILLISECONDS_A_HOUR = 3600000
const MILLISECONDS_A_DAY = 86400000
const MILLISECONDS_A_WEEK = 604800000

const SECONDS_A_MINUTE = 60
const SECONDS_A_HOUR = 3600
const SECONDS_A_DAY = 86400

const MINUTES_A_HOUR = 60
const MINUTES_A_DAY = 1440

const HOURS_A_DAY = 24

const REGEX_FORMAT = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g

// ============================================================================
// Locale System
// ============================================================================

const locales: Record<string, Locale> = {}
let globalLocale = 'en'

const defaultLocale: Locale = {
  name: 'en',
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  weekdaysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ordinal: (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
  },
  formats: {
    LT: 'h:mm A',
    LTS: 'h:mm:ss A',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY h:mm A',
    LLLL: 'dddd, MMMM D, YYYY h:mm A',
  },
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  },
}

locales.en = defaultLocale

function getLocale(name: string): Locale {
  return locales[name] || defaultLocale
}

function setLocale(name: string, locale: Locale): void {
  locales[name] = { ...defaultLocale, ...locale, name }
}

// ============================================================================
// Utility Functions
// ============================================================================

function padStart(str: string | number, length: number, pad: string = '0'): string {
  const s = String(str)
  if (s.length >= length) return s
  return `${pad}${s}`.slice(-length)
}

function parseDate(config: ConfigType): Date {
  const { date, format } = config

  if (date instanceof Date) {
    return new Date(date)
  }

  if (typeof date === 'number') {
    return new Date(date)
  }

  if (typeof date === 'string') {
    // ISO 8601 format
    if (!format) {
      return new Date(date)
    }

    // Custom format parsing (simplified)
    // In production, would need comprehensive format token parsing
    return new Date(date)
  }

  return new Date()
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime())
}

// ============================================================================
// Plugin System
// ============================================================================

const plugins: Plugin[] = []

function extend(plugin: Plugin, option?: any): typeof dayjs {
  if (!plugins.includes(plugin)) {
    plugins.push(plugin)
    plugin(option, Dayjs, dayjs)
  }
  return dayjs
}

// ============================================================================
// Dayjs Class
// ============================================================================

export class Dayjs {
  private $d: Date
  private $L: string
  private $u?: boolean

  constructor(config?: ConfigType) {
    this.$L = config?.locale || globalLocale
    this.$d = parseDate(config || {})
    this.$u = config?.utc
    this.init()
  }

  private init(): void {
    // Initialize any additional properties
  }

  // ========== Getters ==========

  /**
   * Get year
   */
  year(): number {
    return this.$d.getFullYear()
  }

  /**
   * Get month (0-11)
   */
  month(): number {
    return this.$d.getMonth()
  }

  /**
   * Get day of month (1-31)
   */
  date(): number {
    return this.$d.getDate()
  }

  /**
   * Get day of week (0-6, Sunday-Saturday)
   */
  day(): number {
    return this.$d.getDay()
  }

  /**
   * Get hour (0-23)
   */
  hour(): number {
    return this.$d.getHours()
  }

  /**
   * Get minute (0-59)
   */
  minute(): number {
    return this.$d.getMinutes()
  }

  /**
   * Get second (0-59)
   */
  second(): number {
    return this.$d.getSeconds()
  }

  /**
   * Get millisecond (0-999)
   */
  millisecond(): number {
    return this.$d.getMilliseconds()
  }

  /**
   * Get Unix timestamp in seconds
   */
  unix(): number {
    return Math.floor(this.valueOf() / 1000)
  }

  /**
   * Get Unix timestamp in milliseconds
   */
  valueOf(): number {
    return this.$d.getTime()
  }

  /**
   * Get day of year (1-366)
   */
  dayOfYear(): number {
    const startOfYear = this.startOf('year')
    const diff = this.diff(startOfYear, 'day')
    return diff + 1
  }

  /**
   * Get week of year
   */
  week(): number {
    const startOfYear = this.startOf('year')
    const startOfWeek = startOfYear.startOf('week')
    const thisWeek = this.startOf('week')
    return Math.round(thisWeek.diff(startOfWeek, 'week')) + 1
  }

  /**
   * Get number of days in month
   */
  daysInMonth(): number {
    return this.endOf('month').date()
  }

  // ========== Setters ==========

  /**
   * Set year
   */
  set(unit: UnitType, value: number): Dayjs
  set(values: Partial<DayjsObject>): Dayjs
  set(unit: any, value?: any): Dayjs {
    if (typeof unit === 'object') {
      return this.setMultiple(unit)
    }
    return this.setSingle(unit, value)
  }

  private setSingle(unit: UnitType, value: number): Dayjs {
    const newDate = cloneDate(this.$d)

    switch (unit) {
      case 'year':
        newDate.setFullYear(value)
        break
      case 'month':
        newDate.setMonth(value)
        break
      case 'date':
        newDate.setDate(value)
        break
      case 'day':
        const currentDay = newDate.getDay()
        const diff = value - currentDay
        newDate.setDate(newDate.getDate() + diff)
        break
      case 'hour':
        newDate.setHours(value)
        break
      case 'minute':
        newDate.setMinutes(value)
        break
      case 'second':
        newDate.setSeconds(value)
        break
      case 'millisecond':
        newDate.setMilliseconds(value)
        break
    }

    return new Dayjs({ date: newDate, locale: this.$L, utc: this.$u })
  }

  private setMultiple(values: Partial<DayjsObject>): Dayjs {
    let instance: Dayjs = this

    if (values.years !== undefined) instance = instance.set('year', values.years)
    if (values.months !== undefined) instance = instance.set('month', values.months)
    if (values.date !== undefined) instance = instance.set('date', values.date)
    if (values.hours !== undefined) instance = instance.set('hour', values.hours)
    if (values.minutes !== undefined) instance = instance.set('minute', values.minutes)
    if (values.seconds !== undefined) instance = instance.set('second', values.seconds)
    if (values.milliseconds !== undefined) instance = instance.set('millisecond', values.milliseconds)

    return instance
  }

  // ========== Manipulation ==========

  /**
   * Add time
   */
  add(value: number, unit: ManipulateType): Dayjs {
    const newDate = cloneDate(this.$d)
    const normalizedUnit = this.normalizeUnit(unit)

    switch (normalizedUnit) {
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + value)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + value)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + value * 7)
        break
      case 'day':
        newDate.setDate(newDate.getDate() + value)
        break
      case 'hour':
        newDate.setHours(newDate.getHours() + value)
        break
      case 'minute':
        newDate.setMinutes(newDate.getMinutes() + value)
        break
      case 'second':
        newDate.setSeconds(newDate.getSeconds() + value)
        break
      case 'millisecond':
        newDate.setMilliseconds(newDate.getMilliseconds() + value)
        break
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + value * 3)
        break
    }

    return new Dayjs({ date: newDate, locale: this.$L, utc: this.$u })
  }

  /**
   * Subtract time
   */
  subtract(value: number, unit: ManipulateType): Dayjs {
    return this.add(-value, unit)
  }

  /**
   * Start of time period
   */
  startOf(unit: OpUnitType): Dayjs {
    const newDate = cloneDate(this.$d)
    const normalizedUnit = this.normalizeUnit(unit)

    switch (normalizedUnit) {
      case 'year':
        newDate.setMonth(0, 1)
        newDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        newDate.setDate(1)
        newDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        const day = newDate.getDay()
        newDate.setDate(newDate.getDate() - day)
        newDate.setHours(0, 0, 0, 0)
        break
      case 'day':
        newDate.setHours(0, 0, 0, 0)
        break
      case 'hour':
        newDate.setMinutes(0, 0, 0)
        break
      case 'minute':
        newDate.setSeconds(0, 0)
        break
      case 'second':
        newDate.setMilliseconds(0)
        break
      case 'quarter':
        const currentMonth = newDate.getMonth()
        const quarterStartMonth = currentMonth - (currentMonth % 3)
        newDate.setMonth(quarterStartMonth, 1)
        newDate.setHours(0, 0, 0, 0)
        break
    }

    return new Dayjs({ date: newDate, locale: this.$L, utc: this.$u })
  }

  /**
   * End of time period
   */
  endOf(unit: OpUnitType): Dayjs {
    const newDate = cloneDate(this.$d)
    const normalizedUnit = this.normalizeUnit(unit)

    switch (normalizedUnit) {
      case 'year':
        newDate.setMonth(11, 31)
        newDate.setHours(23, 59, 59, 999)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1, 0)
        newDate.setHours(23, 59, 59, 999)
        break
      case 'week':
        const day = newDate.getDay()
        newDate.setDate(newDate.getDate() + (6 - day))
        newDate.setHours(23, 59, 59, 999)
        break
      case 'day':
        newDate.setHours(23, 59, 59, 999)
        break
      case 'hour':
        newDate.setMinutes(59, 59, 999)
        break
      case 'minute':
        newDate.setSeconds(59, 999)
        break
      case 'second':
        newDate.setMilliseconds(999)
        break
      case 'quarter':
        const currentMonth = newDate.getMonth()
        const quarterEndMonth = currentMonth - (currentMonth % 3) + 3
        newDate.setMonth(quarterEndMonth, 0)
        newDate.setHours(23, 59, 59, 999)
        break
    }

    return new Dayjs({ date: newDate, locale: this.$L, utc: this.$u })
  }

  // ========== Display ==========

  /**
   * Format date to string
   */
  format(formatStr: string = 'YYYY-MM-DDTHH:mm:ssZ'): string {
    const locale = getLocale(this.$L)
    const year = this.year()
    const month = this.month()
    const date = this.date()
    const day = this.day()
    const hour = this.hour()
    const minute = this.minute()
    const second = this.second()
    const millisecond = this.millisecond()

    const matches: Record<string, () => string> = {
      'YYYY': () => String(year),
      'YY': () => String(year).slice(-2),
      'MMMM': () => locale.months?.[month] || String(month + 1),
      'MMM': () => locale.monthsShort?.[month] || String(month + 1),
      'MM': () => padStart(month + 1, 2),
      'M': () => String(month + 1),
      'DD': () => padStart(date, 2),
      'D': () => String(date),
      'dddd': () => locale.weekdays?.[day] || String(day),
      'ddd': () => locale.weekdaysShort?.[day] || String(day),
      'dd': () => locale.weekdaysMin?.[day] || String(day),
      'd': () => String(day),
      'HH': () => padStart(hour, 2),
      'H': () => String(hour),
      'hh': () => padStart(hour % 12 || 12, 2),
      'h': () => String(hour % 12 || 12),
      'mm': () => padStart(minute, 2),
      'm': () => String(minute),
      'ss': () => padStart(second, 2),
      's': () => String(second),
      'SSS': () => padStart(millisecond, 3),
      'A': () => hour < 12 ? 'AM' : 'PM',
      'a': () => hour < 12 ? 'am' : 'pm',
      'Z': () => this.formatTimezone(),
      'ZZ': () => this.formatTimezone().replace(':', ''),
    }

    return formatStr.replace(REGEX_FORMAT, (match, $1) => {
      if ($1) return $1
      return matches[match] ? matches[match]() : match
    })
  }

  private formatTimezone(): string {
    const offset = this.$d.getTimezoneOffset()
    const absOffset = Math.abs(offset)
    const sign = offset > 0 ? '-' : '+'
    const hours = Math.floor(absOffset / 60)
    const minutes = absOffset % 60
    return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`
  }

  /**
   * Difference between two dates
   */
  diff(input: Dayjs | Date | string, unit: OpUnitType = 'millisecond', float: boolean = false): number {
    const that = dayjs(input)
    const diff = this.valueOf() - that.valueOf()
    const normalizedUnit = this.normalizeUnit(unit)

    let result: number

    switch (normalizedUnit) {
      case 'year':
        result = this.diffYears(that)
        break
      case 'month':
        result = this.diffMonths(that)
        break
      case 'quarter':
        result = this.diffMonths(that) / 3
        break
      case 'week':
        result = diff / MILLISECONDS_A_WEEK
        break
      case 'day':
        result = diff / MILLISECONDS_A_DAY
        break
      case 'hour':
        result = diff / MILLISECONDS_A_HOUR
        break
      case 'minute':
        result = diff / MILLISECONDS_A_MINUTE
        break
      case 'second':
        result = diff / MILLISECONDS_A_SECOND
        break
      default:
        result = diff
    }

    return float ? result : Math.floor(result)
  }

  private diffYears(that: Dayjs): number {
    return this.year() - that.year()
  }

  private diffMonths(that: Dayjs): number {
    const yearDiff = this.year() - that.year()
    const monthDiff = this.month() - that.month()
    return yearDiff * 12 + monthDiff
  }

  /**
   * Convert to native Date
   */
  toDate(): Date {
    return new Date(this.$d)
  }

  /**
   * Convert to ISO string
   */
  toISOString(): string {
    return this.$d.toISOString()
  }

  /**
   * Convert to JSON
   */
  toJSON(): string {
    return this.toISOString()
  }

  /**
   * Convert to object
   */
  toObject(): DayjsObject {
    return {
      years: this.year(),
      months: this.month(),
      date: this.date(),
      hours: this.hour(),
      minutes: this.minute(),
      seconds: this.second(),
      milliseconds: this.millisecond(),
    }
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.$d.toString()
  }

  // ========== Query ==========

  /**
   * Check if before another date
   */
  isBefore(input: Dayjs | Date | string, unit?: OpUnitType): boolean {
    const that = dayjs(input)
    if (unit) {
      return this.startOf(unit).valueOf() < that.startOf(unit).valueOf()
    }
    return this.valueOf() < that.valueOf()
  }

  /**
   * Check if after another date
   */
  isAfter(input: Dayjs | Date | string, unit?: OpUnitType): boolean {
    const that = dayjs(input)
    if (unit) {
      return this.startOf(unit).valueOf() > that.startOf(unit).valueOf()
    }
    return this.valueOf() > that.valueOf()
  }

  /**
   * Check if same as another date
   */
  isSame(input: Dayjs | Date | string, unit?: OpUnitType): boolean {
    const that = dayjs(input)
    if (unit) {
      return this.startOf(unit).valueOf() === that.startOf(unit).valueOf()
    }
    return this.valueOf() === that.valueOf()
  }

  /**
   * Check if between two dates
   */
  isBetween(a: Dayjs | Date | string, b: Dayjs | Date | string, unit?: OpUnitType, inclusivity: string = '()'): boolean {
    const dayA = dayjs(a)
    const dayB = dayjs(b)

    const startInclusive = inclusivity[0] === '['
    const endInclusive = inclusivity[1] === ']'

    const afterStart = startInclusive ? this.isSame(dayA, unit) || this.isAfter(dayA, unit) : this.isAfter(dayA, unit)
    const beforeEnd = endInclusive ? this.isSame(dayB, unit) || this.isBefore(dayB, unit) : this.isBefore(dayB, unit)

    return afterStart && beforeEnd
  }

  /**
   * Check if leap year
   */
  isLeapYear(): boolean {
    const year = this.year()
    return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0)
  }

  /**
   * Check if valid date
   */
  isValid(): boolean {
    return !isNaN(this.$d.getTime())
  }

  // ========== Locale ==========

  /**
   * Get or set locale
   */
  locale(preset?: string): Dayjs | string {
    if (!preset) return this.$L

    return new Dayjs({
      date: this.$d,
      locale: preset,
      utc: this.$u,
    })
  }

  // ========== Utilities ==========

  /**
   * Clone instance
   */
  clone(): Dayjs {
    return new Dayjs({
      date: this.$d,
      locale: this.$L,
      utc: this.$u,
    })
  }

  /**
   * Normalize unit name
   */
  private normalizeUnit(unit: string): string {
    const units: Record<string, string> = {
      'years': 'year',
      'y': 'year',
      'months': 'month',
      'M': 'month',
      'weeks': 'week',
      'w': 'week',
      'days': 'day',
      'dates': 'day',
      'd': 'day',
      'hours': 'hour',
      'h': 'hour',
      'minutes': 'minute',
      'm': 'minute',
      'seconds': 'second',
      's': 'second',
      'milliseconds': 'millisecond',
      'ms': 'millisecond',
      'quarters': 'quarter',
      'Q': 'quarter',
    }

    return units[unit] || unit
  }
}

// ============================================================================
// Factory Function
// ============================================================================

function dayjs(config?: ConfigType | Date | string | number): Dayjs
function dayjs(date?: Date | string | number, format?: string): Dayjs
function dayjs(date?: any, format?: any): Dayjs {
  if (date instanceof Dayjs) {
    return date.clone()
  }

  const cfg: ConfigType = typeof date === 'object' && !(date instanceof Date)
    ? date
    : { date, format }

  return new Dayjs(cfg)
}

// ============================================================================
// Static Methods
// ============================================================================

/**
 * Set global locale
 */
dayjs.locale = function (preset?: string | Locale, object?: Locale): string {
  if (typeof preset === 'string') {
    if (object) {
      setLocale(preset, object)
    }
    globalLocale = preset
    return globalLocale
  }

  if (preset && typeof preset === 'object') {
    setLocale(preset.name, preset)
    globalLocale = preset.name
    return globalLocale
  }

  return globalLocale
}

/**
 * Extend with plugin
 */
dayjs.extend = extend

/**
 * Check if dayjs object
 */
dayjs.isDayjs = function (d: any): d is Dayjs {
  return d instanceof Dayjs
}

/**
 * Parse Unix timestamp (seconds)
 */
dayjs.unix = function (timestamp: number): Dayjs {
  return dayjs(timestamp * 1000)
}

/**
 * Get current timestamp in milliseconds
 */
dayjs.now = function (): number {
  return Date.now()
}

// ============================================================================
// Built-in Locales
// ============================================================================

// Spanish
setLocale('es', {
  name: 'es',
  weekdays: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  weekdaysMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
  months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  ordinal: (n: number) => `${n}º`,
})

// French
setLocale('fr', {
  name: 'fr',
  weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  weekdaysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  weekdaysMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
  months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  monthsShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
  ordinal: (n: number) => `${n}${n === 1 ? 'er' : ''}`,
})

// German
setLocale('de', {
  name: 'de',
  weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  weekdaysShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  weekdaysMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  ordinal: (n: number) => `${n}.`,
})

// Japanese
setLocale('ja', {
  name: 'ja',
  weekdays: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  weekdaysShort: ['日', '月', '火', '水', '木', '金', '土'],
  weekdaysMin: ['日', '月', '火', '水', '木', '金', '土'],
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  ordinal: (n: number) => `${n}日`,
})

// Chinese
setLocale('zh-cn', {
  name: 'zh-cn',
  weekdays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  weekdaysShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  weekdaysMin: ['日', '一', '二', '三', '四', '五', '六'],
  months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  ordinal: (n: number) => `${n}日`,
})

// ============================================================================
// Plugin: RelativeTime
// ============================================================================

export const relativeTime: Plugin = (option, dayjsClass) => {
  const proto = dayjsClass.prototype

  proto.fromNow = function (withoutSuffix?: boolean): string {
    return this.from(dayjs(), withoutSuffix)
  }

  proto.from = function (compared: Dayjs | Date | string, withoutSuffix?: boolean): string {
    const locale = getLocale(this.$L)
    const diff = this.diff(compared, 'second')
    const absDiff = Math.abs(diff)
    const isFuture = diff < 0

    let result: string

    if (absDiff < 45) {
      result = locale.relativeTime?.s || 'a few seconds'
    } else if (absDiff < 90) {
      result = locale.relativeTime?.m || 'a minute'
    } else if (absDiff < 2700) {
      const minutes = Math.round(absDiff / 60)
      result = (locale.relativeTime?.mm || '%d minutes').replace('%d', String(minutes))
    } else if (absDiff < 5400) {
      result = locale.relativeTime?.h || 'an hour'
    } else if (absDiff < 79200) {
      const hours = Math.round(absDiff / 3600)
      result = (locale.relativeTime?.hh || '%d hours').replace('%d', String(hours))
    } else if (absDiff < 129600) {
      result = locale.relativeTime?.d || 'a day'
    } else if (absDiff < 2246400) {
      const days = Math.round(absDiff / 86400)
      result = (locale.relativeTime?.dd || '%d days').replace('%d', String(days))
    } else if (absDiff < 3888000) {
      result = locale.relativeTime?.M || 'a month'
    } else if (absDiff < 28512000) {
      const months = Math.round(absDiff / 2592000)
      result = (locale.relativeTime?.MM || '%d months').replace('%d', String(months))
    } else if (absDiff < 47304000) {
      result = locale.relativeTime?.y || 'a year'
    } else {
      const years = Math.round(absDiff / 31536000)
      result = (locale.relativeTime?.yy || '%d years').replace('%d', String(years))
    }

    if (withoutSuffix) return result

    const format = isFuture ? locale.relativeTime?.future : locale.relativeTime?.past
    return format ? format.replace('%s', result) : result
  }

  proto.toNow = function (withoutSuffix?: boolean): string {
    return this.to(dayjs(), withoutSuffix)
  }

  proto.to = function (compared: Dayjs | Date | string, withoutSuffix?: boolean): string {
    return dayjs(compared).from(this, withoutSuffix)
  }
}

// ============================================================================
// Plugin: UTC
// ============================================================================

export const utc: Plugin = (option, dayjsClass, dayjsFactory) => {
  dayjsFactory.utc = function (date?: any, format?: any): Dayjs {
    return new dayjsClass({
      date,
      format,
      utc: true,
    })
  }

  const proto = dayjsClass.prototype

  proto.utc = function (keepLocalTime?: boolean): Dayjs {
    if (keepLocalTime) {
      return new dayjsClass({
        date: new Date(
          Date.UTC(
            this.year(),
            this.month(),
            this.date(),
            this.hour(),
            this.minute(),
            this.second(),
            this.millisecond()
          )
        ),
        utc: true,
      })
    }
    return new dayjsClass({ date: this.$d, utc: true })
  }

  proto.local = function (): Dayjs {
    return new dayjsClass({ date: this.$d, utc: false })
  }
}

// ============================================================================
// Plugin: Timezone
// ============================================================================

export const timezone: Plugin = (option, dayjsClass, dayjsFactory) => {
  dayjsFactory.tz = function (date: any, timezone: string): Dayjs {
    // Simplified timezone implementation
    // Production would need full IANA timezone database
    const instance = dayjs(date)
    return instance
  }

  const proto = dayjsClass.prototype

  proto.tz = function (timezone?: string): Dayjs {
    // Simplified timezone implementation
    return this.clone()
  }
}

// ============================================================================
// Type Augmentation for Plugins
// ============================================================================

declare module './dayjs-clone' {
  interface Dayjs {
    fromNow(withoutSuffix?: boolean): string
    from(compared: Dayjs | Date | string, withoutSuffix?: boolean): string
    toNow(withoutSuffix?: boolean): string
    to(compared: Dayjs | Date | string, withoutSuffix?: boolean): string
    utc(keepLocalTime?: boolean): Dayjs
    local(): Dayjs
    tz(timezone?: string): Dayjs
  }

  interface DayjsStatic {
    utc(date?: any, format?: any): Dayjs
    tz(date: any, timezone: string): Dayjs
  }
}

// ============================================================================
// Export
// ============================================================================

export default dayjs
export { Dayjs }
