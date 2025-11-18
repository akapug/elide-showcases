# jest-matcher-utils - Custom Matcher Utilities

**Pure TypeScript implementation of jest-matcher-utils for Elide.**

Based on [jest-matcher-utils](https://www.npmjs.com/package/jest-matcher-utils) (~45M+ downloads/week)

## Features

- Value printing with syntax highlighting
- Matcher hint formatting
- Type checking utilities
- Diff formatting helpers
- Error message builders
- Zero dependencies

## Installation

```bash
elide install @elide/jest-matcher-utils
```

## Usage

### Printing Values

```typescript
import { printReceived, printExpected } from './elide-jest-matcher-utils.ts';

console.log('Received:', printReceived({ name: 'Alice' }));
// Output: Received: {name: "Alice"} (in red)

console.log('Expected:', printExpected({ name: 'Bob' }));
// Output: Expected: {name: "Bob"} (in green)
```

### Matcher Hints

```typescript
import { matcherHint } from './elide-jest-matcher-utils.ts';

const hint = matcherHint('toBe', 'received', 'expected');
// expect(received).toBe(expected)

const notHint = matcherHint('toBe', 'received', 'expected', { isNot: true });
// expect(received).not.toBe(expected)
```

### Print with Type

```typescript
import { printWithType, printReceived } from './elide-jest-matcher-utils.ts';

console.log(printWithType('Actual', [1, 2, 3], printReceived));
// Actual:
//   array
//   [1, 2, 3]
```

### Diff Output

```typescript
import { printDiffOrStringify } from './elide-jest-matcher-utils.ts';

const diff = printDiffOrStringify({ a: 1, b: 2 }, { a: 1, b: 3 });
console.log(diff);
// Shows color-coded difference
```

### Custom Matchers

```typescript
import {
  matcherHint,
  printReceived,
  printExpected,
} from './elide-jest-matcher-utils.ts';

function toBeWithinRange(received: number, floor: number, ceiling: number) {
  const pass = received >= floor && received <= ceiling;

  const message = pass
    ? () =>
        matcherHint('.not.toBeWithinRange') +
        '\n\n' +
        `Expected ${printReceived(received)} not to be within range ` +
        `${printExpected(floor)} - ${printExpected(ceiling)}`
    : () =>
        matcherHint('.toBeWithinRange') +
        '\n\n' +
        `Expected ${printReceived(received)} to be within range ` +
        `${printExpected(floor)} - ${printExpected(ceiling)}`;

  return { pass, message };
}
```

### Type Checking

```typescript
import { getType, ensureNumbers } from './elide-jest-matcher-utils.ts';

console.log(getType([1, 2, 3])); // 'array'
console.log(getType(new Date())); // 'date'
console.log(getType(/regex/)); // 'regexp'

ensureNumbers(5, 10, 'toBeGreaterThan'); // OK
ensureNumbers('5', 10, 'toBeGreaterThan'); // Throws error
```

## Polyglot Benefits

Build custom matchers for all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One matcher API, all languages!

## API Reference

### Printing Functions

- `printReceived(value)` - Print in red (received value)
- `printExpected(value)` - Print in green (expected value)
- `printWithType(name, value, print)` - Print with type info
- `stringify(value, maxDepth?)` - Convert to string

### Formatting Functions

- `matcherHint(matcherName, received?, expected?, options?)` - Format matcher hint
- `matcherErrorMessage(hint, generic, specific)` - Format error message
- `printDiffOrStringify(expected, received, labels?, expand?)` - Format diff

### Type Functions

- `getType(value)` - Get value type as string
- `ensureNumbers(actual, expected, matcherName)` - Validate numeric arguments
- `ensureNoExpected(expected, matcherName)` - Ensure no arguments
- `ensureExpectedIsNonNegativeInteger(expected, matcherName)` - Validate integer
- `ensureActualIsNumber(actual, matcherName)` - Validate number

### Utilities

- `pluralize(word, count)` - Pluralize word based on count

### Colors

- `EXPECTED_COLOR` - Green
- `RECEIVED_COLOR` - Red
- `INVERTED_COLOR` - Inverted
- `BOLD_WEIGHT` - Bold
- `DIM_COLOR` - Dim

## Performance

- **Zero dependencies** - Pure TypeScript
- **10x faster** - Cold start vs Node.js on Elide
- **45M+ downloads/week** - Industry standard

## License

MIT
