/**
 * Day.js Clone - Comprehensive Usage Examples
 */

import dayjs, { relativeTime, utc, timezone } from './dayjs-clone.ts'

// Enable plugins
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

console.log('=== Day.js Clone Examples ===\n')

// Example 1: Basic Usage
console.log('1. Basic Usage')
console.log(`  Now: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`)
console.log(`  Custom: ${dayjs('2024-01-01').format('YYYY-MM-DD')}`)
console.log(`  From timestamp: ${dayjs(1704067200000).format('YYYY-MM-DD')}`)
console.log(`  Unix: ${dayjs.unix(1704067200).format('YYYY-MM-DD')}`)

// Example 2: Formatting
console.log('\n2. Formatting')
const date = dayjs('2024-06-15 14:30:00')
console.log(`  Full: ${date.format('dddd, MMMM D, YYYY h:mm A')}`)
console.log(`  Short: ${date.format('MM/DD/YY')}`)
console.log(`  ISO: ${date.format('YYYY-MM-DDTHH:mm:ss')}`)
console.log(`  Custom: ${date.format('MMM D, YYYY @ h:mm a')}`)

// Example 3: Get Values
console.log('\n3. Get Values')
console.log(`  Year: ${date.year()}`)
console.log(`  Month: ${date.month()} (0-indexed)`)
console.log(`  Date: ${date.date()}`)
console.log(`  Day: ${date.day()} (0=Sunday)`)
console.log(`  Hour: ${date.hour()}`)
console.log(`  Minute: ${date.minute()}`)
console.log(`  Second: ${date.second()}`)

// Example 4: Set Values
console.log('\n4. Set Values')
let modified = dayjs('2024-01-01')
console.log(`  Original: ${modified.format('YYYY-MM-DD')}`)
modified = modified.set('month', 11).set('date', 25)
console.log(`  Modified: ${modified.format('YYYY-MM-DD')}`)

// Example 5: Add/Subtract
console.log('\n5. Add/Subtract')
const base = dayjs('2024-06-15')
console.log(`  Base: ${base.format('YYYY-MM-DD')}`)
console.log(`  +7 days: ${base.add(7, 'day').format('YYYY-MM-DD')}`)
console.log(`  +1 month: ${base.add(1, 'month').format('YYYY-MM-DD')}`)
console.log(`  -2 weeks: ${base.subtract(2, 'week').format('YYYY-MM-DD')}`)

// Example 6: Start/End of Period
console.log('\n6. Start/End of Period')
const period = dayjs('2024-06-15 14:30:00')
console.log(`  Start of year: ${period.startOf('year').format('YYYY-MM-DD HH:mm:ss')}`)
console.log(`  Start of month: ${period.startOf('month').format('YYYY-MM-DD HH:mm:ss')}`)
console.log(`  Start of day: ${period.startOf('day').format('YYYY-MM-DD HH:mm:ss')}`)
console.log(`  End of month: ${period.endOf('month').format('YYYY-MM-DD HH:mm:ss')}`)

// Example 7: Comparison
console.log('\n7. Comparison')
const a = dayjs('2024-06-15')
const b = dayjs('2024-06-20')
console.log(`  A: ${a.format('YYYY-MM-DD')}`)
console.log(`  B: ${b.format('YYYY-MM-DD')}`)
console.log(`  A is before B: ${a.isBefore(b)}`)
console.log(`  A is after B: ${a.isAfter(b)}`)
console.log(`  A is same as B: ${a.isSame(b)}`)
console.log(`  Same month: ${a.isSame(b, 'month')}`)

// Example 8: Difference
console.log('\n8. Difference')
const start = dayjs('2024-01-01')
const end = dayjs('2024-12-31')
console.log(`  Days: ${end.diff(start, 'day')}`)
console.log(`  Weeks: ${end.diff(start, 'week')}`)
console.log(`  Months: ${end.diff(start, 'month')}`)
console.log(`  Years: ${end.diff(start, 'year', true).toFixed(2)}`)

// Example 9: Relative Time
console.log('\n9. Relative Time (fromNow/toNow)')
console.log(`  Now: ${dayjs().fromNow()}`)
console.log(`  Yesterday: ${dayjs().subtract(1, 'day').fromNow()}`)
console.log(`  Tomorrow: ${dayjs().add(1, 'day').fromNow()}`)
console.log(`  Next week: ${dayjs().add(1, 'week').fromNow()}`)
console.log(`  Last month: ${dayjs().subtract(1, 'month').fromNow()}`)

// Example 10: Chaining
console.log('\n10. Chaining')
const chained = dayjs('2024-01-15')
  .add(1, 'month')
  .subtract(3, 'day')
  .startOf('day')
  .add(12, 'hour')
console.log(`  Chained result: ${chained.format('YYYY-MM-DD HH:mm:ss')}`)

// Example 11: Locales
console.log('\n11. Locales')
const localeDate = dayjs('2024-01-01')
console.log(`  English: ${localeDate.format('MMMM')}`)
console.log(`  Spanish: ${localeDate.locale('es').format('MMMM')}`)
console.log(`  French: ${localeDate.locale('fr').format('MMMM')}`)
console.log(`  German: ${localeDate.locale('de').format('MMMM')}`)
console.log(`  Japanese: ${localeDate.locale('ja').format('MMMM')}`)

// Example 12: Queries
console.log('\n12. Queries')
const query = dayjs('2024-06-15')
console.log(`  Is leap year: ${query.isLeapYear()}`)
console.log(`  Is valid: ${query.isValid()}`)
console.log(`  Days in month: ${query.daysInMonth()}`)
console.log(`  Week of year: ${query.week()}`)
console.log(`  Day of year: ${query.dayOfYear()}`)

// Example 13: Clone and Immutability
console.log('\n13. Clone and Immutability')
const original = dayjs('2024-01-01')
const cloned = original.clone()
const modified2 = original.add(1, 'month')
console.log(`  Original: ${original.format('YYYY-MM-DD')}`)
console.log(`  Cloned: ${cloned.format('YYYY-MM-DD')}`)
console.log(`  Modified: ${modified2.format('YYYY-MM-DD')}`)
console.log(`  Original unchanged: ${original.isSame(cloned)}`)

// Example 14: Between
console.log('\n14. Between')
const test = dayjs('2024-06-15')
const rangeStart = dayjs('2024-06-01')
const rangeEnd = dayjs('2024-06-30')
console.log(`  Is between (inclusive): ${test.isBetween(rangeStart, rangeEnd, null, '[]')}`)
console.log(`  Is between (exclusive): ${test.isBetween(rangeStart, rangeEnd, null, '()')}`)

// Example 15: Performance
console.log('\n15. Performance Benchmarks')
const perfStart1 = Date.now()
for (let i = 0; i < 10000; i++) {
  dayjs().format('YYYY-MM-DD HH:mm:ss')
}
console.log(`  10,000 format() calls: ${Date.now() - perfStart1}ms`)

const perfStart2 = Date.now()
let testDate = dayjs()
for (let i = 0; i < 10000; i++) {
  testDate = testDate.add(1, 'day')
}
console.log(`  10,000 add() calls: ${Date.now() - perfStart2}ms`)

console.log('\n=== Examples Complete ===')
