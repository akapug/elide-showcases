/**
 * date-fns Clone - Comprehensive Usage Examples
 */

import {
  format,
  addDays,
  addMonths,
  subMonths,
  isAfter,
  isBefore,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  isSameDay,
  isWeekend,
  addBusinessDays,
  eachDayOfInterval,
  es,
  fr,
  de,
  ja,
} from './date-fns-clone.ts'

console.log('=== date-fns Clone Examples ===\n')

// Example 1: Basic Formatting
console.log('1. Basic Formatting')
const now = new Date()
console.log(`  Current: ${format(now, 'yyyy-MM-dd HH:mm:ss')}`)
console.log(`  Formatted: ${format(now, 'MMMM do, yyyy')}`)
console.log(`  Short: ${format(now, 'MMM d, yy')}`)
console.log(`  With time: ${format(now, 'EEE, MMM d @ h:mm a')}`)

// Example 2: Date Arithmetic
console.log('\n2. Date Arithmetic')
const baseDate = new Date(2024, 0, 15)
console.log(`  Base: ${format(baseDate, 'yyyy-MM-dd')}`)
console.log(`  +7 days: ${format(addDays(baseDate, 7), 'yyyy-MM-dd')}`)
console.log(`  +3 months: ${format(addMonths(baseDate, 3), 'yyyy-MM-dd')}`)
console.log(`  -2 months: ${format(subMonths(baseDate, 2), 'yyyy-MM-dd')}`)

// Example 3: Date Comparison
console.log('\n3. Date Comparison')
const date1 = new Date(2024, 5, 15)
const date2 = new Date(2024, 5, 20)
console.log(`  Date 1: ${format(date1, 'yyyy-MM-dd')}`)
console.log(`  Date 2: ${format(date2, 'yyyy-MM-dd')}`)
console.log(`  Date1 is after Date2: ${isAfter(date1, date2)}`)
console.log(`  Date1 is before Date2: ${isBefore(date1, date2)}`)
console.log(`  Days between: ${differenceInDays(date2, date1)}`)

// Example 4: Week Boundaries
console.log('\n4. Week Boundaries')
const someDate = new Date(2024, 5, 15)
console.log(`  Date: ${format(someDate, 'EEEE, MMMM d, yyyy')}`)
console.log(`  Start of week: ${format(startOfWeek(someDate), 'EEEE, MMMM d, yyyy')}`)
console.log(`  End of week: ${format(endOfWeek(someDate), 'EEEE, MMMM d, yyyy')}`)

// Example 5: Month Boundaries
console.log('\n5. Month Boundaries')
console.log(`  Start of month: ${format(startOfMonth(someDate), 'yyyy-MM-dd')}`)
console.log(`  End of month: ${format(endOfMonth(someDate), 'yyyy-MM-dd')}`)

// Example 6: Relative Formatting
console.log('\n6. Relative Formatting')
const yesterday = subMonths(now, 0)
const tomorrow = addDays(now, 1)
const nextWeek = addDays(now, 7)
console.log(`  Yesterday: ${formatDistance(yesterday, now, { addSuffix: true })}`)
console.log(`  Tomorrow: ${formatDistance(tomorrow, now, { addSuffix: true })}`)
console.log(`  Next week: ${formatDistance(nextWeek, now, { addSuffix: true })}`)
console.log(`  Relative: ${formatRelative(tomorrow, now)}`)

// Example 7: ISO Parsing
console.log('\n7. ISO Parsing')
const isoString = '2024-12-25T10:30:00Z'
const parsed = parseISO(isoString)
console.log(`  ISO: ${isoString}`)
console.log(`  Parsed: ${format(parsed, 'PPPP')}`)
console.log(`  Valid: ${isValid(parsed)}`)

// Example 8: Same Day Comparison
console.log('\n8. Same Day Comparison')
const morning = new Date(2024, 5, 15, 9, 0)
const evening = new Date(2024, 5, 15, 18, 0)
const nextDay = new Date(2024, 5, 16, 9, 0)
console.log(`  Morning & Evening same day: ${isSameDay(morning, evening)}`)
console.log(`  Morning & Next Day same day: ${isSameDay(morning, nextDay)}`)

// Example 9: Weekend Detection
console.log('\n9. Weekend Detection')
const monday = new Date(2024, 5, 17)
const saturday = new Date(2024, 5, 22)
console.log(`  ${format(monday, 'EEEE')}: ${isWeekend(monday) ? 'Weekend' : 'Weekday'}`)
console.log(`  ${format(saturday, 'EEEE')}: ${isWeekend(saturday) ? 'Weekend' : 'Weekday'}`)

// Example 10: Business Days
console.log('\n10. Business Days')
const startBiz = new Date(2024, 5, 14) // Friday
console.log(`  Start: ${format(startBiz, 'EEEE, MMM d')}`)
console.log(`  +5 business days: ${format(addBusinessDays(startBiz, 5), 'EEEE, MMM d')}`)

// Example 11: Date Ranges
console.log('\n11. Date Ranges')
const rangeStart = new Date(2024, 5, 1)
const rangeEnd = new Date(2024, 5, 7)
const daysInRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
console.log(`  Days in range:`)
daysInRange.forEach(day => {
  console.log(`    ${format(day, 'EEEE, MMM d')}`)
})

// Example 12: i18n Support
console.log('\n12. Internationalization')
const i18nDate = new Date(2024, 0, 1)
console.log(`  English: ${format(i18nDate, 'PPPP')}`)
console.log(`  Spanish: ${format(i18nDate, 'PPPP', { locale: es })}`)
console.log(`  French: ${format(i18nDate, 'PPPP', { locale: fr })}`)
console.log(`  German: ${format(i18nDate, 'PPPP', { locale: de })}`)
console.log(`  Japanese: ${format(i18nDate, 'PPPP', { locale: ja })}`)

// Example 13: Custom Formatting Patterns
console.log('\n13. Custom Formatting')
const customDate = new Date(2024, 5, 15, 14, 30, 45)
console.log(`  Full: ${format(customDate, 'EEEE, MMMM do yyyy, h:mm:ss a')}`)
console.log(`  ISO: ${format(customDate, "yyyy-MM-dd'T'HH:mm:ss")}`)
console.log(`  Custom: ${format(customDate, 'EEE MMM dd yyyy HH:mm:ss')}`)

// Example 14: Performance Test
console.log('\n14. Performance Benchmarks')
const perfStart = Date.now()
for (let i = 0; i < 10000; i++) {
  format(new Date(), 'yyyy-MM-dd HH:mm:ss')
}
const perfEnd = Date.now()
console.log(`  10,000 format() calls: ${perfEnd - perfStart}ms`)

const addStart = Date.now()
let testDate = new Date()
for (let i = 0; i < 100000; i++) {
  testDate = addDays(testDate, 1)
}
const addEnd = Date.now()
console.log(`  100,000 addDays() calls: ${addEnd - addStart}ms`)

console.log('\n=== Examples Complete ===')
