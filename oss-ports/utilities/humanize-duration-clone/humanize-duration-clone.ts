/**
 * Humanize Duration Clone for Elide
 * Convert milliseconds to human-readable duration strings
 *
 * @module humanize-duration-clone
 * @version 1.0.0
 */

// ============================================================================
// Types
// ============================================================================

export type Unit = 'y' | 'mo' | 'w' | 'd' | 'h' | 'm' | 's' | 'ms'

export interface Language {
  y?: (c: number) => string
  mo?: (c: number) => string
  w?: (c: number) => string
  d?: (c: number) => string
  h?: (c: number) => string
  m?: (c: number) => string
  s?: (c: number) => string
  ms?: (c: number) => string
  decimal?: string
}

export interface Languages {
  [key: string]: Language
}

export interface Options {
  language?: string
  languages?: Languages
  delimiter?: string
  spacer?: string
  largest?: number
  units?: Unit[]
  round?: boolean
  decimal?: string
  conjunction?: string
  serialComma?: boolean
  unitMeasures?: {
    y?: number
    mo?: number
    w?: number
    d?: number
    h?: number
    m?: number
    s?: number
    ms?: number
  }
}

export interface UnitMeasures {
  y: number
  mo: number
  w: number
  d: number
  h: number
  m: number
  s: number
  ms: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_UNIT_MEASURES: UnitMeasures = {
  y: 31557600000,
  mo: 2629800000,
  w: 604800000,
  d: 86400000,
  h: 3600000,
  m: 60000,
  s: 1000,
  ms: 1,
}

// ============================================================================
// Language Definitions
// ============================================================================

const LANGUAGES: Languages = {
  en: {
    y: (c) => 'year' + (c === 1 ? '' : 's'),
    mo: (c) => 'month' + (c === 1 ? '' : 's'),
    w: (c) => 'week' + (c === 1 ? '' : 's'),
    d: (c) => 'day' + (c === 1 ? '' : 's'),
    h: (c) => 'hour' + (c === 1 ? '' : 's'),
    m: (c) => 'minute' + (c === 1 ? '' : 's'),
    s: (c) => 'second' + (c === 1 ? '' : 's'),
    ms: (c) => 'millisecond' + (c === 1 ? '' : 's'),
    decimal: '.',
  },
  es: {
    y: (c) => 'año' + (c === 1 ? '' : 's'),
    mo: (c) => 'mes' + (c === 1 ? '' : 'es'),
    w: (c) => 'semana' + (c === 1 ? '' : 's'),
    d: (c) => 'día' + (c === 1 ? '' : 's'),
    h: (c) => 'hora' + (c === 1 ? '' : 's'),
    m: (c) => 'minuto' + (c === 1 ? '' : 's'),
    s: (c) => 'segundo' + (c === 1 ? '' : 's'),
    ms: (c) => 'milisegundo' + (c === 1 ? '' : 's'),
    decimal: ',',
  },
  fr: {
    y: (c) => 'an' + (c === 1 ? '' : 's'),
    mo: () => 'mois',
    w: (c) => 'semaine' + (c === 1 ? '' : 's'),
    d: (c) => 'jour' + (c === 1 ? '' : 's'),
    h: (c) => 'heure' + (c === 1 ? '' : 's'),
    m: (c) => 'minute' + (c === 1 ? '' : 's'),
    s: (c) => 'seconde' + (c === 1 ? '' : 's'),
    ms: (c) => 'milliseconde' + (c === 1 ? '' : 's'),
    decimal: ',',
  },
  de: {
    y: (c) => 'Jahr' + (c === 1 ? '' : 'e'),
    mo: (c) => 'Monat' + (c === 1 ? '' : 'e'),
    w: (c) => 'Woche' + (c === 1 ? '' : 'n'),
    d: (c) => 'Tag' + (c === 1 ? '' : 'e'),
    h: (c) => 'Stunde' + (c === 1 ? '' : 'n'),
    m: (c) => 'Minute' + (c === 1 ? '' : 'n'),
    s: (c) => 'Sekunde' + (c === 1 ? '' : 'n'),
    ms: (c) => 'Millisekunde' + (c === 1 ? '' : 'n'),
    decimal: ',',
  },
  it: {
    y: (c) => 'anno' + (c === 1 ? '' : 'i'),
    mo: (c) => 'mese' + (c === 1 ? '' : 'i'),
    w: (c) => 'settimana' + (c === 1 ? '' : 'e'),
    d: (c) => 'giorno' + (c === 1 ? '' : 'i'),
    h: (c) => 'ora' + (c === 1 ? '' : 'e'),
    m: (c) => 'minuto' + (c === 1 ? '' : 'i'),
    s: (c) => 'secondo' + (c === 1 ? '' : 'i'),
    ms: (c) => 'millisecondo' + (c === 1 ? '' : 'i'),
    decimal: ',',
  },
  pt: {
    y: (c) => 'ano' + (c === 1 ? '' : 's'),
    mo: (c) => 'mês' + (c === 1 ? '' : 'es'),
    w: (c) => 'semana' + (c === 1 ? '' : 's'),
    d: (c) => 'dia' + (c === 1 ? '' : 's'),
    h: (c) => 'hora' + (c === 1 ? '' : 's'),
    m: (c) => 'minuto' + (c === 1 ? '' : 's'),
    s: (c) => 'segundo' + (c === 1 ? '' : 's'),
    ms: (c) => 'milissegundo' + (c === 1 ? '' : 's'),
    decimal: ',',
  },
  ru: {
    y: (c) => {
      if (c % 10 === 1 && c % 100 !== 11) return 'год'
      if (c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 10 || c % 100 >= 20)) return 'года'
      return 'лет'
    },
    mo: (c) => {
      if (c % 10 === 1 && c % 100 !== 11) return 'месяц'
      if (c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 10 || c % 100 >= 20)) return 'месяца'
      return 'месяцев'
    },
    w: (c) => {
      if (c % 10 === 1 && c % 100 !== 11) return 'неделя'
      if (c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 10 || c % 100 >= 20)) return 'недели'
      return 'недель'
    },
    d: (c) => {
      if (c % 10 === 1 && c % 100 !== 11) return 'день'
      if (c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 10 || c % 100 >= 20)) return 'дня'
      return 'дней'
    },
    h: (c) => {
      if (c % 10 === 1 && c % 100 !== 11) return 'час'
      if (c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 10 || c % 100 >= 20)) return 'часа'
      return 'часов'
    },
    m: (c) => {
      if (c % 10 === 1 && c % 100 !== 11) return 'минута'
      if (c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 10 || c % 100 >= 20)) return 'минуты'
      return 'минут'
    },
    s: (c) => {
      if (c % 10 === 1 && c % 100 !== 11) return 'секунда'
      if (c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 10 || c % 100 >= 20)) return 'секунды'
      return 'секунд'
    },
    ms: (c) => {
      if (c % 10 === 1 && c % 100 !== 11) return 'миллисекунда'
      if (c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 10 || c % 100 >= 20)) return 'миллисекунды'
      return 'миллисекунд'
    },
    decimal: ',',
  },
  ja: {
    y: () => '年',
    mo: () => 'ヶ月',
    w: () => '週間',
    d: () => '日',
    h: () => '時間',
    m: () => '分',
    s: () => '秒',
    ms: () => 'ミリ秒',
    decimal: '.',
  },
  zh_CN: {
    y: () => '年',
    mo: () => '个月',
    w: () => '周',
    d: () => '天',
    h: () => '小时',
    m: () => '分钟',
    s: () => '秒',
    ms: () => '毫秒',
    decimal: '.',
  },
  ko: {
    y: () => '년',
    mo: () => '개월',
    w: () => '주',
    d: () => '일',
    h: () => '시간',
    m: () => '분',
    s: () => '초',
    ms: () => '밀리초',
    decimal: '.',
  },
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Convert milliseconds to human-readable duration
 */
export function humanizeDuration(ms: number, options: Options = {}): string {
  const {
    language = 'en',
    languages = {},
    delimiter = ', ',
    spacer = ' ',
    largest,
    units = ['y', 'mo', 'w', 'd', 'h', 'm', 's'],
    round = false,
    decimal,
    conjunction,
    serialComma = true,
    unitMeasures = {},
  } = options

  // Get language
  const lang = { ...LANGUAGES.en, ...LANGUAGES[language], ...languages[language] }
  const decimalSeparator = decimal || lang.decimal || '.'

  // Get unit measures
  const measures: UnitMeasures = { ...DEFAULT_UNIT_MEASURES, ...unitMeasures }

  // Calculate values
  const values: Array<{ unit: Unit; value: number }> = []
  let remaining = Math.abs(ms)

  for (const unit of units) {
    const measure = measures[unit]
    if (measure > 0) {
      const value = Math.floor(remaining / measure)
      if (value > 0 || (round && values.length === 0)) {
        values.push({ unit, value })
        remaining -= value * measure
      }
    }
  }

  // Handle rounding
  if (round && values.length === 0 && units.length > 0) {
    const lastUnit = units[units.length - 1]
    values.push({ unit: lastUnit, value: 0 })
  }

  // Limit to largest
  const limitedValues = largest ? values.slice(0, largest) : values

  // Format values
  const formatted = limitedValues.map(({ unit, value }) => {
    const unitFunc = lang[unit]
    const unitStr = unitFunc ? unitFunc(value) : unit
    return `${value}${spacer}${unitStr}`
  })

  // Handle empty
  if (formatted.length === 0) {
    const fallbackUnit = units[units.length - 1] || 'ms'
    const unitFunc = lang[fallbackUnit]
    const unitStr = unitFunc ? unitFunc(0) : fallbackUnit
    return `0${spacer}${unitStr}`
  }

  // Join with conjunction
  if (conjunction && formatted.length > 1) {
    const last = formatted.pop()!
    const rest = formatted.join(delimiter)
    const comma = serialComma && formatted.length > 1 ? ',' : ''
    return `${rest}${comma}${conjunction}${last}`
  }

  return formatted.join(delimiter)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGES)
}

/**
 * Add custom language
 */
export function addLanguage(code: string, language: Language): void {
  LANGUAGES[code] = language
}

// ============================================================================
// Export
// ============================================================================

export default humanizeDuration
export { humanizeDuration, LANGUAGES }
