/**
 * Nanoid Clone - Usage Examples
 */

import {
  nanoid,
  customAlphabet,
  urlAlphabet,
  numbers,
  lowercase,
  uppercase,
  hex,
  alphanumeric,
  base58,
  collisionProbability,
  safeIdCount,
  entropyBits,
  validate,
  batch,
  benchmark,
} from './nanoid-clone.ts'

console.log('=== Nanoid Clone Examples ===\n')

// Example 1: Basic Usage
console.log('1. Basic Usage')
console.log(`  Default ID: ${nanoid()}`)
console.log(`  Short ID (10): ${nanoid(10)}`)
console.log(`  Tiny ID (5): ${nanoid(5)}`)

// Example 2: Custom Alphabets
console.log('\n2. Custom Alphabets')
const pinGenerator = customAlphabet('0123456789', 4)
console.log(`  PIN: ${pinGenerator()}`)

const hexId = customAlphabet('0123456789ABCDEF', 8)
console.log(`  Hex ID: ${hexId()}`)

const readable = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 10)
console.log(`  Readable: ${readable()}`)

// Example 3: Predefined Generators
console.log('\n3. Predefined Generators')
console.log(`  Numbers: ${numbers(10)}`)
console.log(`  Lowercase: ${lowercase(10)}`)
console.log(`  Uppercase: ${uppercase(10)}`)
console.log(`  Hex: ${hex(16)}`)
console.log(`  Alphanumeric: ${alphanumeric(12)}`)
console.log(`  Base58: ${base58(12)}`)

// Example 4: Batch Generation
console.log('\n4. Batch Generation')
const ids = batch(5, 10)
console.log(`  Generated ${ids.length} IDs:`)
ids.forEach((id, i) => console.log(`    ${i + 1}. ${id}`))

// Example 5: Validation
console.log('\n5. Validation')
const testId = nanoid(21)
console.log(`  ID: ${testId}`)
console.log(`  Valid: ${validate(testId, urlAlphabet, 21)}`)
console.log(`  Invalid: ${validate('invalid!@#', urlAlphabet)}`)

// Example 6: Collision Probability
console.log('\n6. Collision Probability')
const prob1M = collisionProbability(64, 21, 1000000)
console.log(`  1M IDs (21 chars): ${(prob1M * 100).toFixed(6)}%`)

const safe = safeIdCount(64, 21, 0.01)
console.log(`  Safe count (1% collision): ${safe.toLocaleString()}`)

// Example 7: Entropy
console.log('\n7. Entropy')
console.log(`  21 chars (base64): ${entropyBits(64, 21)} bits`)
console.log(`  10 chars (base64): ${entropyBits(64, 10)} bits`)
console.log(`  UUID: ${entropyBits(16, 32)} bits`)

// Example 8: Performance
console.log('\n8. Performance')
const opsPerSec = benchmark(10000, 21)
console.log(`  ${opsPerSec.toLocaleString()} ops/sec`)

// Example 9: Use Cases
console.log('\n9. Use Cases')
console.log(`  User ID: ${nanoid()}`)
console.log(`  Session Token: ${nanoid(32)}`)
console.log(`  Short URL: ${nanoid(8)}`)
console.log(`  Transaction ID: ${hexUppercase(16)}`)
console.log(`  Verification Code: ${numbers(6)}`)

console.log('\n=== Examples Complete ===')
