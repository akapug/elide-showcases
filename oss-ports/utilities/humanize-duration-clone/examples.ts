/**
 * Humanize Duration Clone - Usage Examples
 */

import humanizeDuration, { getSupportedLanguages } from './humanize-duration-clone.ts'

console.log('=== Humanize Duration Clone Examples ===\n')

// Example 1: Basic Usage
console.log('1. Basic Usage')
console.log(`  1 second: ${humanizeDuration(1000)}`)
console.log(`  1 minute: ${humanizeDuration(60000)}`)
console.log(`  1 hour: ${humanizeDuration(3600000)}`)
console.log(`  1 day: ${humanizeDuration(86400000)}`)

// Example 2: Complex Durations
console.log('\n2. Complex Durations')
console.log(`  97320000ms: ${humanizeDuration(97320000)}`)
console.log(`  3661000ms: ${humanizeDuration(3661000)}`)

// Example 3: Languages
console.log('\n3. Languages')
console.log(`  English: ${humanizeDuration(3600000, { language: 'en' })}`)
console.log(`  Spanish: ${humanizeDuration(3600000, { language: 'es' })}`)
console.log(`  French: ${humanizeDuration(3600000, { language: 'fr' })}`)
console.log(`  German: ${humanizeDuration(3600000, { language: 'de' })}`)
console.log(`  Japanese: ${humanizeDuration(3600000, { language: 'ja' })}`)
console.log(`  Chinese: ${humanizeDuration(3600000, { language: 'zh_CN' })}`)

// Example 4: Units
console.log('\n4. Units')
console.log(`  Days only: ${humanizeDuration(97320000, { units: ['d'] })}`)
console.log(`  Hours only: ${humanizeDuration(97320000, { units: ['h'] })}`)
console.log(`  Days + Hours: ${humanizeDuration(97320000, { units: ['d', 'h'] })}`)

// Example 5: Largest
console.log('\n5. Largest N Units')
console.log(`  Largest 1: ${humanizeDuration(97320000, { largest: 1 })}`)
console.log(`  Largest 2: ${humanizeDuration(97320000, { largest: 2 })}`)
console.log(`  Largest 3: ${humanizeDuration(97320000, { largest: 3 })}`)

// Example 6: Delimiter
console.log('\n6. Custom Delimiter')
console.log(`  ' and ': ${humanizeDuration(97320000, { delimiter: ' and ' })}`)
console.log(`  ' + ': ${humanizeDuration(97320000, { delimiter: ' + ' })}`)

// Example 7: Conjunction
console.log('\n7. Conjunction')
console.log(`  Conjunction: ${humanizeDuration(97320000, { conjunction: ' and ' })}`)

// Example 8: Supported Languages
console.log('\n8. Supported Languages')
console.log(`  ${getSupportedLanguages().join(', ')}`)

console.log('\n=== Examples Complete ===')
