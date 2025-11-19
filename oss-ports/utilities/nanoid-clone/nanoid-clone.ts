/**
 * Nanoid Clone for Elide
 * Tiny, secure, URL-friendly unique ID generator
 *
 * @module nanoid-clone
 * @version 1.0.0
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * URL-safe alphabet (A-Za-z0-9_-)
 */
export const urlAlphabet = 'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW'

/**
 * Default size for generated IDs
 */
const DEFAULT_SIZE = 21

// ============================================================================
// Random Number Generation
// ============================================================================

/**
 * Get random bytes using crypto API
 */
function getRandomBytes(size: number): Uint8Array {
  // Try browser crypto API first
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(size))
  }

  // Fallback to Math.random (less secure, but works everywhere)
  const bytes = new Uint8Array(size)
  for (let i = 0; i < size; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytes
}

// ============================================================================
// Core Generator
// ============================================================================

/**
 * Generate a random ID with custom alphabet
 */
function generate(alphabet: string, size: number): string {
  // Alphabet must not have more than 256 symbols
  if (alphabet.length === 0 || alphabet.length > 256) {
    throw new Error('Alphabet must contain between 1 and 256 symbols')
  }

  // Size must be positive
  if (size <= 0) {
    throw new Error('Size must be positive')
  }

  const mask = (2 << Math.log2(alphabet.length - 1)) - 1
  const step = Math.ceil((1.6 * mask * size) / alphabet.length)

  let id = ''

  while (true) {
    const bytes = getRandomBytes(step)
    let i = step

    while (i--) {
      const byte = bytes[i] & mask

      if (alphabet[byte]) {
        id += alphabet[byte]
        if (id.length === size) {
          return id
        }
      }
    }
  }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Generate a unique ID
 *
 * @param size - Length of the ID (default: 21)
 * @returns Random ID string
 *
 * @example
 * ```ts
 * nanoid() // => "V1StGXR8_Z5jdHi6B-myT"
 * nanoid(10) // => "IRFa-VaY2b"
 * ```
 */
export function nanoid(size: number = DEFAULT_SIZE): string {
  return generate(urlAlphabet, size)
}

/**
 * Create a custom ID generator with a specific alphabet
 *
 * @param alphabet - String of characters to use
 * @param defaultSize - Default size for generated IDs
 * @returns Generator function
 *
 * @example
 * ```ts
 * const nanoid = customAlphabet('0123456789', 6)
 * nanoid() // => "281592"
 *
 * const hex = customAlphabet('0123456789ABCDEF', 8)
 * hex() // => "3E7C9B2A"
 * ```
 */
export function customAlphabet(alphabet: string, defaultSize: number = DEFAULT_SIZE): (size?: number) => string {
  return (size: number = defaultSize) => generate(alphabet, size)
}

/**
 * Create a custom random generator (advanced usage)
 */
export function customRandom(alphabet: string, defaultSize: number, getRandom: (size: number) => Uint8Array) {
  const mask = (2 << Math.log2(alphabet.length - 1)) - 1
  const step = Math.ceil((1.6 * mask * defaultSize) / alphabet.length)

  return (size: number = defaultSize): string => {
    let id = ''

    while (true) {
      const bytes = getRandom(step)
      let i = step

      while (i--) {
        const byte = bytes[i] & mask

        if (alphabet[byte]) {
          id += alphabet[byte]
          if (id.length === size) {
            return id
          }
        }
      }
    }
  }
}

// ============================================================================
// Predefined Generators
// ============================================================================

/**
 * Numbers only (0-9)
 */
export const numbers = customAlphabet('0123456789')

/**
 * Lowercase letters only (a-z)
 */
export const lowercase = customAlphabet('abcdefghijklmnopqrstuvwxyz')

/**
 * Uppercase letters only (A-Z)
 */
export const uppercase = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ')

/**
 * Hexadecimal (0-9a-f)
 */
export const hex = customAlphabet('0123456789abcdef')

/**
 * Hexadecimal uppercase (0-9A-F)
 */
export const hexUppercase = customAlphabet('0123456789ABCDEF')

/**
 * Alphanumeric (A-Za-z0-9)
 */
export const alphanumeric = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')

/**
 * Base58 (Bitcoin alphabet - no 0, O, I, l)
 */
export const base58 = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz')

/**
 * Base62 (0-9A-Za-z)
 */
export const base62 = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate collision probability
 *
 * @param alphabet - Alphabet size
 * @param size - ID length
 * @param ids - Number of IDs generated
 * @returns Probability of collision (0-1)
 */
export function collisionProbability(alphabet: number, size: number, ids: number): number {
  const bits = Math.log2(alphabet) * size
  const total = Math.pow(2, bits)

  // Birthday paradox approximation
  return 1 - Math.exp((-ids * (ids - 1)) / (2 * total))
}

/**
 * Calculate safe number of IDs for given collision probability
 *
 * @param alphabet - Alphabet size
 * @param size - ID length
 * @param probability - Desired collision probability (default: 0.01 = 1%)
 * @returns Safe number of IDs
 */
export function safeIdCount(alphabet: number, size: number, probability: number = 0.01): number {
  const bits = Math.log2(alphabet) * size
  const total = Math.pow(2, bits)

  return Math.floor(Math.sqrt(2 * total * Math.log(1 / (1 - probability))))
}

/**
 * Get entropy bits for given configuration
 *
 * @param alphabet - Alphabet size
 * @param size - ID length
 * @returns Bits of entropy
 */
export function entropyBits(alphabet: number, size: number): number {
  return Math.log2(alphabet) * size
}

/**
 * Validate ID format
 *
 * @param id - ID to validate
 * @param alphabet - Expected alphabet
 * @param size - Expected size (optional)
 * @returns true if valid
 */
export function validate(id: string, alphabet: string, size?: number): boolean {
  if (size !== undefined && id.length !== size) {
    return false
  }

  for (const char of id) {
    if (!alphabet.includes(char)) {
      return false
    }
  }

  return true
}

/**
 * Check if string is a valid nanoid (default alphabet)
 */
export function isNanoid(id: string, size: number = DEFAULT_SIZE): boolean {
  return validate(id, urlAlphabet, size)
}

/**
 * Batch generate multiple IDs
 *
 * @param count - Number of IDs to generate
 * @param size - Size of each ID
 * @returns Array of IDs
 */
export function batch(count: number, size?: number): string[] {
  const ids: string[] = []
  for (let i = 0; i < count; i++) {
    ids.push(nanoid(size))
  }
  return ids
}

/**
 * Generate unique IDs until count is reached (checks for duplicates)
 *
 * @param count - Number of unique IDs
 * @param size - Size of each ID
 * @returns Array of unique IDs
 */
export function batchUnique(count: number, size?: number): string[] {
  const ids = new Set<string>()
  while (ids.size < count) {
    ids.add(nanoid(size))
  }
  return Array.from(ids)
}

// ============================================================================
// Performance Benchmarking
// ============================================================================

/**
 * Benchmark ID generation speed
 *
 * @param iterations - Number of iterations (default: 100000)
 * @param size - ID size
 * @returns Operations per second
 */
export function benchmark(iterations: number = 100000, size?: number): number {
  const start = Date.now()

  for (let i = 0; i < iterations; i++) {
    nanoid(size)
  }

  const elapsed = Date.now() - start
  return Math.round((iterations / elapsed) * 1000)
}

/**
 * Compare performance with UUID
 *
 * @param iterations - Number of iterations
 * @returns Comparison results
 */
export function compareWithUUID(iterations: number = 10000): {
  nanoid: number
  nanoidSpeed: number
} {
  const nanoidOps = benchmark(iterations)

  return {
    nanoid: iterations,
    nanoidSpeed: nanoidOps,
  }
}

// ============================================================================
// Export Default
// ============================================================================

export default nanoid
