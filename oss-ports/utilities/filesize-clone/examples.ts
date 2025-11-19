/**
 * Filesize Clone - Usage Examples
 */

import filesize from './filesize-clone.ts'

console.log('=== Filesize Clone Examples ===\n')

// Example 1: Basic Usage
console.log('1. Basic Usage')
console.log(`  1024 bytes: ${filesize(1024)}`)
console.log(`  1 MB: ${filesize(1024 * 1024)}`)
console.log(`  1 GB: ${filesize(1024 * 1024 * 1024)}`)

// Example 2: Decimal (base 10)
console.log('\n2. Decimal (base 10)')
console.log(`  1000 bytes: ${filesize(1000, { base: 10 })}`)
console.log(`  1000000 bytes: ${filesize(1000000, { base: 10 })}`)

// Example 3: Precision
console.log('\n3. Precision')
console.log(`  1500 (1 decimal): ${filesize(1500, { round: 1 })}`)
console.log(`  1500 (2 decimals): ${filesize(1500, { round: 2 })}`)

// Example 4: Rounding Methods
console.log('\n4. Rounding Methods')
console.log(`  1536 (round): ${filesize(1536, { roundingMethod: 'round' })}`)
console.log(`  1536 (floor): ${filesize(1536, { roundingMethod: 'floor' })}`)
console.log(`  1536 (ceil): ${filesize(1536, { roundingMethod: 'ceil' })}`)

// Example 5: Bits
console.log('\n5. Bits')
console.log(`  1024 bits: ${filesize(1024, { bits: true })}`)
console.log(`  1048576 bits: ${filesize(1048576, { bits: true })}`)

// Example 6: Full Form
console.log('\n6. Full Form')
console.log(`  1024: ${filesize(1024, { fullform: true })}`)
console.log(`  2048: ${filesize(2048, { fullform: true })}`)

// Example 7: Output Formats
console.log('\n7. Output Formats')
console.log(`  Array: ${JSON.stringify(filesize(1024, { output: 'array' }))}`)
console.log(`  Object: ${JSON.stringify(filesize(1024, { output: 'object' }))}`)

// Example 8: Standards
console.log('\n8. Standards')
console.log(`  IEC: ${filesize(1024, { standard: 'iec' })}`)
console.log(`  JEDEC: ${filesize(1024, { standard: 'jedec' })}`)

console.log('\n=== Examples Complete ===')
