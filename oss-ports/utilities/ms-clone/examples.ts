/**
 * ms Clone - Usage Examples
 */

import ms from './ms-clone.ts'

console.log('=== ms Clone Examples ===\n')

// Example 1: String to Milliseconds
console.log('1. String to Milliseconds')
console.log(`  '2 days': ${ms('2 days')}`)
console.log(`  '1d': ${ms('1d')}`)
console.log(`  '10h': ${ms('10h')}`)
console.log(`  '2.5 hrs': ${ms('2.5 hrs')}`)
console.log(`  '2h': ${ms('2h')}`)
console.log(`  '1m': ${ms('1m')}`)
console.log(`  '5s': ${ms('5s')}`)
console.log(`  '100ms': ${ms('100ms')}`)

// Example 2: Milliseconds to String
console.log('\n2. Milliseconds to String')
console.log(`  60000: ${ms(60000)}`)
console.log(`  120000: ${ms(120000)}`)
console.log(`  3600000: ${ms(3600000)}`)
console.log(`  86400000: ${ms(86400000)}`)

// Example 3: Long Format
console.log('\n3. Long Format')
console.log(`  1000 (long): ${ms(1000, { long: true })}`)
console.log(`  60000 (long): ${ms(60000, { long: true })}`)
console.log(`  3600000 (long): ${ms(3600000, { long: true })}`)
console.log(`  86400000 (long): ${ms(86400000, { long: true })}`)

// Example 4: Practical Use
console.log('\n4. Practical Use')
const timeout = ms('5s')
console.log(`  setTimeout: ${timeout}ms`)

const interval = ms('30m')
console.log(`  setInterval: ${interval}ms`)

const cache = ms('1h')
console.log(`  Cache TTL: ${cache}ms`)

console.log('\n=== Examples Complete ===')
