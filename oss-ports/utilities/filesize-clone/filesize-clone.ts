/**
 * Filesize Clone for Elide
 * Convert file sizes to human-readable strings
 *
 * @module filesize-clone
 * @version 1.0.0
 */

// ============================================================================
// Types
// ============================================================================

export interface Options {
  base?: 2 | 10
  bits?: boolean
  output?: 'string' | 'array' | 'object'
  round?: number
  roundingMethod?: 'round' | 'floor' | 'ceil'
  separator?: string
  spacer?: string
  standard?: 'iec' | 'jedec'
  symbols?: Partial<Symbols>
  fullform?: boolean
  fullforms?: string[]
  exponent?: number
  locale?: string | boolean
  localeOptions?: Intl.NumberFormatOptions
  pad?: boolean
}

export interface Symbols {
  B?: string
  KB?: string
  MB?: string
  GB?: string
  TB?: string
  PB?: string
  EB?: string
  ZB?: string
  YB?: string
}

export interface FilesizeObject {
  value: number | string
  symbol: string
  exponent: number
  unit: string
}

export type FilesizeArray = [number | string, string]

// ============================================================================
// Constants
// ============================================================================

const BITS_SYMBOLS = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb']
const BYTES_IEC_SYMBOLS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
const BYTES_JEDEC_SYMBOLS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

const FULLFORM_BITS = ['bit', 'kilobit', 'megabit', 'gigabit', 'terabit', 'petabit', 'exabit', 'zettabit', 'yottabit']
const FULLFORM_BYTES = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte', 'exabyte', 'zettabyte', 'yottabyte']

// ============================================================================
// Main Function
// ============================================================================

/**
 * Convert bytes to human-readable filesize
 */
export function filesize(bytes: number, options: Options = {}): string | FilesizeArray | FilesizeObject {
  const {
    base = 2,
    bits = false,
    output = 'string',
    round = 2,
    roundingMethod = 'round',
    separator = '',
    spacer = ' ',
    standard = 'iec',
    symbols = {},
    fullform = false,
    fullforms,
    exponent,
    locale = false,
    localeOptions = {},
    pad = false,
  } = options

  // Validate input
  if (typeof bytes !== 'number' || isNaN(bytes)) {
    throw new TypeError('Invalid number')
  }

  const neg = bytes < 0
  const num = Math.abs(bytes)

  // Determine base and symbols
  const baseValue = base === 10 ? 1000 : 1024

  let symbolList: string[]
  let fullformList: string[]

  if (bits) {
    symbolList = BITS_SYMBOLS
    fullformList = fullforms || FULLFORM_BITS
  } else {
    symbolList = standard === 'iec' ? BYTES_IEC_SYMBOLS : BYTES_JEDEC_SYMBOLS
    fullformList = fullforms || FULLFORM_BYTES
  }

  // Override with custom symbols
  if (Object.keys(symbols).length > 0) {
    symbolList = symbolList.map((sym, idx) => {
      const key = sym.replace(/i?B$/, 'B') as keyof Symbols
      return symbols[key] || sym
    })
  }

  // Calculate exponent
  let e: number
  if (exponent !== undefined) {
    e = exponent
  } else if (num === 0) {
    e = 0
  } else {
    e = Math.floor(Math.log(num) / Math.log(baseValue))
  }

  // Clamp exponent
  if (e < 0) e = 0
  if (e >= symbolList.length) e = symbolList.length - 1

  // Calculate value
  const val = e === 0 ? num : num / Math.pow(baseValue, e)

  // Round value
  let result: number
  if (roundingMethod === 'ceil') {
    result = Math.ceil(val * Math.pow(10, round)) / Math.pow(10, round)
  } else if (roundingMethod === 'floor') {
    result = Math.floor(val * Math.pow(10, round)) / Math.pow(10, round)
  } else {
    result = Math.round(val * Math.pow(10, round)) / Math.pow(10, round)
  }

  if (neg) result = -result

  // Get symbol
  const symbol = symbolList[e]
  const unit = fullform ? fullformList[e] + (result === 1 ? '' : 's') : symbol

  // Format number
  let formattedValue: string | number = result

  if (locale) {
    const localeStr = typeof locale === 'string' ? locale : undefined
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: pad ? round : 0,
      maximumFractionDigits: round,
      ...localeOptions,
    }
    formattedValue = result.toLocaleString(localeStr, options)
  } else if (separator) {
    const parts = result.toFixed(round).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    formattedValue = parts.join('.')
  } else if (pad) {
    formattedValue = result.toFixed(round)
  } else {
    formattedValue = result
  }

  // Return based on output format
  if (output === 'array') {
    return [formattedValue, unit]
  }

  if (output === 'object') {
    return {
      value: formattedValue,
      symbol: unit,
      exponent: e,
      unit: fullform ? fullformList[e] : symbol,
    }
  }

  return `${formattedValue}${spacer}${unit}`
}

// ============================================================================
// Partial Application
// ============================================================================

/**
 * Create a filesize function with default options
 */
export function partial(defaultOptions: Options): (bytes: number, options?: Options) => string | FilesizeArray | FilesizeObject {
  return (bytes: number, options?: Options) => {
    return filesize(bytes, { ...defaultOptions, ...options })
  }
}

// ============================================================================
// Export
// ============================================================================

export default filesize
export { filesize }
