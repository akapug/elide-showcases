/**
 * jest-matcher-utils - Utilities for writing custom matchers
 *
 * Helper functions for creating expressive test assertions.
 * **POLYGLOT SHOWCASE**: Build matchers for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jest-matcher-utils (~45M+ downloads/week)
 *
 * Features:
 * - Value printing utilities
 * - Diff formatting
 * - Matcher messages
 * - Type checking helpers
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need test matchers
 * - ONE matcher API works everywhere on Elide
 * - Share custom assertions across languages
 * - Consistent test output
 *
 * Use cases:
 * - Custom matchers
 * - Test library development
 * - Assertion helpers
 * - Domain-specific assertions
 *
 * Package has ~45M+ downloads/week on npm!
 */

export const EXPECTED_COLOR = '\x1b[32m'; // Green
export const RECEIVED_COLOR = '\x1b[31m'; // Red
export const INVERTED_COLOR = '\x1b[7m'; // Inverted
export const BOLD_WEIGHT = '\x1b[1m'; // Bold
export const DIM_COLOR = '\x1b[2m'; // Dim
const RESET = '\x1b[0m';

/**
 * Print a value with syntax highlighting
 */
export function printReceived(value: any): string {
  return `${RECEIVED_COLOR}${stringify(value)}${RESET}`;
}

/**
 * Print expected value with highlighting
 */
export function printExpected(value: any): string {
  return `${EXPECTED_COLOR}${stringify(value)}${RESET}`;
}

/**
 * Print a value with custom color
 */
export function printWithType(
  name: string,
  value: any,
  print: (val: any) => string
): string {
  const type = getType(value);
  const hasType = type !== 'null' && type !== 'undefined';

  return (
    `${name}:` +
    (hasType ? `\n  ${DIM_COLOR}${type}${RESET}\n  ` : ' ') +
    print(value)
  );
}

/**
 * Stringify a value for display
 */
export function stringify(value: any, maxDepth = 3, depth = 0): string {
  if (depth > maxDepth) {
    return '[...]';
  }

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol') return value.toString();

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (depth >= maxDepth) return '[Array]';
    const items = value
      .slice(0, 10)
      .map((item) => stringify(item, maxDepth, depth + 1));
    const more = value.length > 10 ? `, ... ${value.length - 10} more` : '';
    return `[${items.join(', ')}${more}]`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof RegExp) {
    return value.toString();
  }

  if (value instanceof Error) {
    return `[${value.name}: ${value.message}]`;
  }

  if (typeof value === 'object') {
    if (depth >= maxDepth) return '[Object]';
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    const items = keys.slice(0, 10).map((key) => {
      const val = stringify(value[key], maxDepth, depth + 1);
      return `${key}: ${val}`;
    });
    const more = keys.length > 10 ? `, ... ${keys.length - 10} more` : '';
    return `{${items.join(', ')}${more}}`;
  }

  return String(value);
}

/**
 * Get the type of a value
 */
export function getType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (value instanceof RegExp) return 'regexp';
  if (value instanceof Error) return 'error';
  return typeof value;
}

/**
 * Ensure the value is not null or undefined
 */
export function ensureNoExpected(
  expected: any,
  matcherName: string,
  options?: any
): void {
  if (expected !== undefined && expected !== null) {
    throw new Error(
      `${matcherName} matcher does not accept any arguments, received: ${stringify(expected)}`
    );
  }
}

/**
 * Ensure numbers for comparison
 */
export function ensureNumbers(
  actual: any,
  expected: any,
  matcherName: string
): void {
  if (typeof actual !== 'number' || typeof expected !== 'number') {
    throw new Error(
      `${matcherName} matcher requires numeric arguments.\n` +
        `Received:\n` +
        `  ${printWithType('actual', actual, printReceived)}\n` +
        `  ${printWithType('expected', expected, printExpected)}`
    );
  }
}

/**
 * Ensure expected is a valid value
 */
export function ensureExpectedIsNonNegativeInteger(
  expected: any,
  matcherName: string
): void {
  if (
    typeof expected !== 'number' ||
    !Number.isInteger(expected) ||
    expected < 0
  ) {
    throw new Error(
      `${matcherName} matcher requires a non-negative integer.\n` +
        `Received: ${printExpected(expected)}`
    );
  }
}

/**
 * Format matcher hint
 */
export function matcherHint(
  matcherName: string,
  received = 'received',
  expected = 'expected',
  options: {
    comment?: string;
    isNot?: boolean;
    promise?: string;
    secondArgument?: string;
  } = {}
): string {
  const { comment = '', isNot = false, promise = '', secondArgument = '' } = options;

  let hint = DIM_COLOR + 'expect' + RESET;

  if (promise) {
    hint += DIM_COLOR + '.' + promise + RESET;
  }

  hint += '(' + RECEIVED_COLOR + received + RESET + ')';

  if (isNot) {
    hint += DIM_COLOR + '.not' + RESET;
  }

  hint += DIM_COLOR + '.' + matcherName + RESET;
  hint += '(' + EXPECTED_COLOR + expected + RESET;

  if (secondArgument) {
    hint += DIM_COLOR + ', ' + RESET + EXPECTED_COLOR + secondArgument + RESET;
  }

  hint += ')';

  if (comment) {
    hint += DIM_COLOR + ' // ' + comment + RESET;
  }

  return hint;
}

/**
 * Format matcher error message
 */
export function matcherErrorMessage(
  hint: string,
  generic: string,
  specific: string
): string {
  return `${hint}\n\n${BOLD_WEIGHT}${generic}${RESET}\n${specific}`;
}

/**
 * Format difference line
 */
export function printDiffOrStringify(
  expected: any,
  received: any,
  expectedLabel = 'Expected',
  receivedLabel = 'Received',
  expand = false
): string {
  const expectedStr = stringify(expected);
  const receivedStr = stringify(received);

  if (expectedStr === receivedStr) {
    return (
      `${EXPECTED_COLOR}${expectedLabel}:${RESET} ${expectedStr}\n` +
      `${RECEIVED_COLOR}${receivedLabel}:${RESET} ${receivedStr}\n\n` +
      `${DIM_COLOR}Compared values serialize to the same structure.${RESET}`
    );
  }

  return (
    `${EXPECTED_COLOR}${expectedLabel}:${RESET} ${printExpected(expected)}\n` +
    `${RECEIVED_COLOR}${receivedLabel}:${RESET} ${printReceived(received)}`
  );
}

/**
 * Pluralize a word
 */
export function pluralize(word: string, count: number): string {
  return count === 1 ? word : word + 's';
}

/**
 * Ensure actual is defined
 */
export function ensureActualIsNumber(actual: any, matcherName: string): void {
  if (typeof actual !== 'number') {
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherName),
        `${RECEIVED_COLOR}received${RESET} value must be a number`,
        printWithType('Received', actual, printReceived)
      )
    );
  }
}

export default {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  INVERTED_COLOR,
  BOLD_WEIGHT,
  DIM_COLOR,
  printReceived,
  printExpected,
  printWithType,
  stringify,
  getType,
  ensureNoExpected,
  ensureNumbers,
  ensureExpectedIsNonNegativeInteger,
  ensureActualIsNumber,
  matcherHint,
  matcherErrorMessage,
  printDiffOrStringify,
  pluralize,
};

// CLI Demo
if (import.meta.url.includes('elide-jest-matcher-utils.ts')) {
  console.log('🔧 jest-matcher-utils - Custom Matcher Utilities (POLYGLOT!)\n');

  // Example 1: Print values
  console.log('Example 1: Printing Values\n');
  console.log('Received:', printReceived({ name: 'Alice', age: 30 }));
  console.log('Expected:', printExpected({ name: 'Bob', age: 25 }));
  console.log();

  // Example 2: Matcher hints
  console.log('Example 2: Matcher Hints\n');
  console.log(matcherHint('toBe', 'received', 'expected'));
  console.log(matcherHint('toBe', 'received', 'expected', { isNot: true }));
  console.log(
    matcherHint('resolves', 'promise', 'expected', { promise: 'resolves' })
  );
  console.log();

  // Example 3: Print with type
  console.log('Example 3: Print with Type\n');
  console.log(printWithType('Actual', [1, 2, 3], printReceived));
  console.log(printWithType('Expected', { a: 1 }, printExpected));
  console.log();

  // Example 4: Diff output
  console.log('Example 4: Diff Output\n');
  console.log(printDiffOrStringify({ a: 1, b: 2 }, { a: 1, b: 3 }));
  console.log();

  // Example 5: Type checking
  console.log('Example 5: Type Information\n');
  console.log('Type of [1,2,3]:', getType([1, 2, 3]));
  console.log('Type of new Date():', getType(new Date()));
  console.log('Type of /regex/:', getType(/regex/));
  console.log('Type of null:', getType(null));
  console.log();

  console.log('✅ Use Cases:');
  console.log('- Custom matchers for testing');
  console.log('- Test library development');
  console.log('- Domain-specific assertions');
  console.log('- Better error messages');
  console.log();

  console.log('🚀 Performance:');
  console.log('- Zero dependencies');
  console.log('- ~45M+ downloads/week on npm!');
  console.log();

  console.log('💡 Polyglot Tips:');
  console.log('- Build custom matchers for any language');
  console.log('- Consistent test output everywhere');
  console.log('- Share assertion libraries across stack!');
}
