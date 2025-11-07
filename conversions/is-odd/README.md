# is-odd - Elide Polyglot Showcase

> **One is-odd implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Check if a number is odd with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different odd/even detection** in each language creates:
- ❌ Negative number handling bugs (Python vs JavaScript `%` operator)
- ❌ Type coercion inconsistencies (string "5" vs number 5)
- ❌ Pagination UI differences
- ❌ Integration test failures

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Correctly handles positive and negative numbers
- ✅ Works with zero
- ✅ Validates non-integers (returns `false`)
- ✅ Handles type coercion (strings → numbers)
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Sub-microsecond performance

## 🚀 Quick Start

### TypeScript

```typescript
import isOdd from './elide-is-odd.ts';

console.log(isOdd(3));   // true
console.log(isOdd(2));   // false
console.log(isOdd(-1));  // true
console.log(isOdd(0));   // false
console.log(isOdd(3.5)); // false (not an integer)

// Array filtering
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const oddNumbers = numbers.filter(isOdd);
// [1, 3, 5, 7, 9]
```

### Python

```python
from elide import require
is_odd = require('./elide-is-odd.ts')

# Filter odd numbers
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
odd_numbers = [n for n in numbers if is_odd.default(n)]
# [1, 3, 5, 7, 9]
```

### Ruby

```ruby
is_odd = Elide.require('./elide-is-odd.ts')

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
odd_numbers = numbers.select { |n| is_odd.default(n) }
# [1, 3, 5, 7, 9]
```

### Java

```java
Value isOdd = context.eval("js", "require('./elide-is-odd.ts')");

List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
List<Integer> oddNumbers = numbers.stream()
    .filter(n -> isOdd.getMember("default").execute(n).asBoolean())
    .collect(Collectors.toList());
// [1, 3, 5, 7, 9]
```

## 📊 Performance

Benchmark results (1,000,000 operations):

| Implementation | Time | Per Operation |
|---|---|---|
| **Elide (TypeScript)** | **~45ms** | **0.045µs** |
| Native JS `% 2` | ~36ms | 0.036µs |

Sub-microsecond performance makes it suitable for high-throughput scenarios.

Run the benchmark:
```bash
elide run benchmark.ts
```

## 💡 Use Cases

### 1. Array Filtering

```typescript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const oddNumbers = numbers.filter(isOdd);
```

### 2. Pagination UI

```typescript
function getPageClass(pageNum: number): string {
  return isOdd(pageNum) ? 'odd-page' : 'even-page';
}
```

### 3. Data Validation

```typescript
function validateUserId(id: number): void {
  if (!isOdd(id)) {
    throw new Error('User ID must be odd');
  }
}
```

### 4. Batch Processing Strategy

```typescript
function processBatch(batchId: number, data: Data[]): void {
  const strategy = isOdd(batchId) ? 'fast' : 'thorough';
  processWithStrategy(data, strategy);
}
```

## 📖 API Reference

### `isOdd(value: any): boolean`

Returns `true` if the value is an odd integer, `false` otherwise.

**Parameters:**
- `value`: The value to check (will be converted to number if possible)

**Returns:**
- `boolean`: `true` if odd integer, `false` otherwise

**Examples:**

```typescript
isOdd(3);      // true
isOdd(2);      // false
isOdd(-1);     // true (negative odd)
isOdd(-2);     // false (negative even)
isOdd(0);      // false (zero is even)
isOdd(3.5);    // false (not an integer)
isOdd("5");    // true (string converted to number)
isOdd("abc");  // false (NaN)
isOdd(NaN);    // false
```

## 🔍 Edge Cases

All edge cases are handled correctly:

```typescript
isOdd(-3);           // true (negative odd)
isOdd(0);            // false (zero is even)
isOdd(3.5);          // false (not an integer)
isOdd("5");          // true (string coercion)
isOdd(NaN);          // false
isOdd(Infinity);     // false
isOdd(999999999);    // true (large numbers)
```

## 📂 Files in This Showcase

- `elide-is-odd.ts` - Main TypeScript implementation (12 lines)
- `elide-is-odd.py` - Python integration example
- `elide-is-odd.rb` - Ruby integration example
- `ElideIsOddExample.java` - Java integration example
- `benchmark.ts` - Performance comparison
- `CASE_STUDY.md` - Real-world bug fix story
- `README.md` - This file

## 🏆 Real-World Success

From [CASE_STUDY.md](./CASE_STUDY.md):

**ShopFlow** (e-commerce platform) eliminated bugs by unifying odd/even detection:
- **0 odd/even bugs** (down from 3-4/month)
- **Fixed payment routing bug** (negative number handling)
- **Consistent pagination UI** across all services
- **~4 hours/month saved** on debugging

---

**Built with ❤️ for the Elide Polyglot Runtime**
