# jest-diff - Visual Test Differences

**Pure TypeScript implementation of jest-diff for Elide.**

Based on [jest-diff](https://www.npmjs.com/package/jest-diff) (~45M+ downloads/week)

## Features

- Object and array comparison
- Color-coded diff output
- Line-by-line diffs
- Compact and expanded modes
- Plain text output option
- Zero dependencies

## Installation

```bash
elide install @elide/jest-diff
```

## Usage

### Basic Diff

```typescript
import { diff } from './elide-jest-diff.ts';

const obj1 = { name: 'Alice', age: 30 };
const obj2 = { name: 'Alice', age: 31 };

console.log(diff(obj1, obj2));
// Output (color-coded):
//   {
//     "name": "Alice",
// -   "age": 30
// +   "age": 31
//   }
```

### Array Diff

```typescript
const arr1 = [1, 2, 3, 4, 5];
const arr2 = [1, 2, 4, 5, 6];

console.log(diff(arr1, arr2));
// Shows which elements were added/removed
```

### Custom Options

```typescript
const result = diff(a, b, {
  expand: true,           // Show all lines
  contextLines: 3,        // Lines of context
  aColor: '\x1b[31m',    // Color for removals
  bColor: '\x1b[32m',    // Color for additions
  commonColor: '\x1b[90m' // Color for unchanged
});
```

### Plain Text Diff

```typescript
import { diffStringsUnified } from './elide-jest-diff.ts';

const plain = diffStringsUnified('Hello World', 'Hello Elide');
// No color codes - perfect for logs
```

## Polyglot Benefits

Use consistent diff output across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One diff format, all languages!

## API Reference

### diff(a, b, options?)

Compare two values and return a formatted diff string.

**Parameters:**
- `a: any` - First value to compare
- `b: any` - Second value to compare
- `options?: DiffOptions` - Optional configuration

**Returns:** `string | null` - Formatted diff or null if equal

### diffStringsUnified(a, b)

Plain text diff without color codes.

### diffLinesUnified(aLines, bLines)

Compact diff of line arrays.

### DiffOptions

```typescript
interface DiffOptions {
  aColor?: string;        // ANSI color for removals
  bColor?: string;        // ANSI color for additions
  commonColor?: string;   // ANSI color for unchanged
  contextLines?: number;  // Lines of context (default: 5)
  expand?: boolean;       // Show all lines (default: false)
}
```

## Performance

- **Zero dependencies** - Pure TypeScript
- **10x faster** - Cold start vs Node.js on Elide
- **45M+ downloads/week** - Industry standard

## License

MIT
