/**
 * pretty-ms Clone - Usage Examples
 */

import prettyMs, { timeAgo, formatDuration } from './pretty-ms-clone.ts'

console.log('=== pretty-ms Clone Examples ===\n')

// Example 1: Basic Usage
console.log('1. Basic Usage')
console.log(`  1 second: ${prettyMs(1000)}`)
console.log(`  1 minute: ${prettyMs(60000)}`)
console.log(`  1 hour: ${prettyMs(3600000)}`)
console.log(`  1 day: ${prettyMs(86400000)}`)

// Example 2: Complex Durations
console.log('\n2. Complex Durations')
console.log(`  95500ms: ${prettyMs(95500)}`)
console.log(`  1337000000ms: ${prettyMs(1337000000)}`)

// Example 3: Compact Mode
console.log('\n3. Compact Mode')
console.log(`  95500ms: ${prettyMs(95500, { compact: true })}`)
console.log(`  1337000000ms: ${prettyMs(1337000000, { compact: true })}`)

// Example 4: Verbose Mode
console.log('\n4. Verbose Mode')
console.log(`  1000ms: ${prettyMs(1000, { verbose: true })}`)
console.log(`  95500ms: ${prettyMs(95500, { verbose: true })}`)

// Example 5: Precision
console.log('\n5. Precision')
console.log(`  1337ms (1 decimal): ${prettyMs(1337, { secondsDecimalDigits: 1 })}`)
console.log(`  1337ms (2 decimals): ${prettyMs(1337, { secondsDecimalDigits: 2 })}`)
console.log(`  1337ms (0 decimals): ${prettyMs(1337, { secondsDecimalDigits: 0 })}`)

// Example 6: Unit Count
console.log('\n6. Unit Count')
console.log(`  95500ms (2 units): ${prettyMs(95500, { unitCount: 2 })}`)
console.log(`  95500ms (1 unit): ${prettyMs(95500, { unitCount: 1 })}`)

// Example 7: Colon Notation
console.log('\n7. Colon Notation')
console.log(`  95500ms: ${prettyMs(95500, { colonNotation: true })}`)
console.log(`  3665000ms: ${prettyMs(3665000, { colonNotation: true })}`)

// Example 8: Time Ago
console.log('\n8. Time Ago')
const now = new Date()
const past = new Date(now.getTime() - 95500)
console.log(`  95 seconds ago: ${timeAgo(past, now)}`)

// Example 9: Duration
console.log('\n9. Duration')
const start = new Date('2024-01-01T00:00:00Z')
const end = new Date('2024-01-01T01:35:30Z')
console.log(`  Duration: ${formatDuration(start, end)}`)

console.log('\n=== Examples Complete ===')
