/**
 * jest-diff - Difference output for testing
 *
 * Display differences between any two values for better test output.
 * **POLYGLOT SHOWCASE**: Visual diffs for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jest-diff (~45M+ downloads/week)
 *
 * Features:
 * - Object/array comparison
 * - Color-coded output
 * - Line-by-line diffs
 * - Compact mode
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need test output
 * - ONE diff library works everywhere on Elide
 * - Consistent visual test feedback
 * - Share test reporters across languages
 *
 * Use cases:
 * - Test assertion output
 * - Object comparison
 * - Debugging test failures
 * - CI/CD test reports
 *
 * Package has ~45M+ downloads/week on npm!
 */

export interface DiffOptions {
  aColor?: string;
  bColor?: string;
  commonColor?: string;
  contextLines?: number;
  expand?: boolean;
}

interface DiffLine {
  type: 'add' | 'remove' | 'common';
  value: string;
}

/**
 * Compare two values and return a formatted diff string
 */
export function diff(a: any, b: any, options: DiffOptions = {}): string | null {
  const {
    aColor = '\x1b[31m',
    bColor = '\x1b[32m',
    commonColor = '\x1b[90m',
    contextLines = 5,
    expand = false,
  } = options;

  const reset = '\x1b[0m';

  // Serialize values
  const aStr = serialize(a);
  const bStr = serialize(b);

  if (aStr === bStr) {
    return null; // No difference
  }

  const aLines = aStr.split('\n');
  const bLines = bStr.split('\n');

  // Compute diff lines
  const diffLines = computeDiff(aLines, bLines);

  // Format output
  let result = '';
  let lastType: string | null = null;

  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];

    // Add context separator
    if (!expand && lastType !== null && lastType !== line.type) {
      const nextContext = diffLines.slice(i, i + contextLines);
      if (nextContext.every((l) => l.type === 'common')) {
        result += `${commonColor}  ...${reset}\n`;
        i += contextLines - 1;
        continue;
      }
    }

    // Format line based on type
    if (line.type === 'add') {
      result += `${bColor}+ ${line.value}${reset}\n`;
    } else if (line.type === 'remove') {
      result += `${aColor}- ${line.value}${reset}\n`;
    } else if (expand || i < contextLines || i >= diffLines.length - contextLines) {
      result += `${commonColor}  ${line.value}${reset}\n`;
    }

    lastType = line.type;
  }

  return result;
}

/**
 * Compute line-by-line diff
 */
function computeDiff(aLines: string[], bLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < aLines.length || j < bLines.length) {
    if (i >= aLines.length) {
      // Only b lines remaining
      result.push({ type: 'add', value: bLines[j] });
      j++;
    } else if (j >= bLines.length) {
      // Only a lines remaining
      result.push({ type: 'remove', value: aLines[i] });
      i++;
    } else if (aLines[i] === bLines[j]) {
      // Lines match
      result.push({ type: 'common', value: aLines[i] });
      i++;
      j++;
    } else {
      // Lines differ - check which side changed
      const aNext = aLines.slice(i + 1).indexOf(bLines[j]);
      const bNext = bLines.slice(j + 1).indexOf(aLines[i]);

      if (aNext !== -1 && (bNext === -1 || aNext < bNext)) {
        // a has extra lines
        result.push({ type: 'remove', value: aLines[i] });
        i++;
      } else if (bNext !== -1) {
        // b has extra lines
        result.push({ type: 'add', value: bLines[j] });
        j++;
      } else {
        // Both lines changed
        result.push({ type: 'remove', value: aLines[i] });
        result.push({ type: 'add', value: bLines[j] });
        i++;
        j++;
      }
    }
  }

  return result;
}

/**
 * Serialize a value to a string for comparison
 */
function serialize(value: any, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return '[Function]';

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((item) => `${spaces}  ${serialize(item, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${spaces}]`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    const items = keys.map(
      (key) => `${spaces}  "${key}": ${serialize(value[key], indent + 1)}`
    );
    return `{\n${items.join(',\n')}\n${spaces}}`;
  }

  return String(value);
}

/**
 * No-color version for plain text output
 */
export function diffStringsUnified(a: string, b: string): string | null {
  return diff(a, b, {
    aColor: '',
    bColor: '',
    commonColor: '',
  });
}

/**
 * Compact diff for inline display
 */
export function diffLinesUnified(aLines: string[], bLines: string[]): string | null {
  const a = aLines.join('\n');
  const b = bLines.join('\n');
  return diff(a, b, { expand: false });
}

export default diff;

// CLI Demo
if (import.meta.url.includes('elide-jest-diff.ts')) {
  console.log('📊 jest-diff - Visual Test Differences for Elide (POLYGLOT!)\n');

  // Example 1: Object differences
  console.log('Example 1: Object Diff\n');
  const obj1 = { name: 'Alice', age: 30, city: 'NYC' };
  const obj2 = { name: 'Alice', age: 31, city: 'SF' };
  console.log(diff(obj1, obj2));

  // Example 2: Array differences
  console.log('\nExample 2: Array Diff\n');
  const arr1 = [1, 2, 3, 4, 5];
  const arr2 = [1, 2, 4, 5, 6];
  console.log(diff(arr1, arr2));

  // Example 3: String differences
  console.log('\nExample 3: String Diff\n');
  const str1 = 'Hello World';
  const str2 = 'Hello Elide';
  console.log(diff(str1, str2));

  // Example 4: Nested structures
  console.log('\nExample 4: Nested Object Diff\n');
  const nested1 = {
    user: { name: 'Bob', settings: { theme: 'dark', lang: 'en' } },
  };
  const nested2 = {
    user: { name: 'Bob', settings: { theme: 'light', lang: 'es' } },
  };
  console.log(diff(nested1, nested2));

  // Example 5: No-color diff
  console.log('\nExample 5: Plain Text Diff\n');
  console.log(diffStringsUnified('foo\nbar\nbaz', 'foo\nqux\nbaz'));

  console.log('\n✅ Use Cases:');
  console.log('- Test assertion output');
  console.log('- Object comparison in tests');
  console.log('- Debugging test failures');
  console.log('- CI/CD test reports');
  console.log();

  console.log('🚀 Performance:');
  console.log('- Zero dependencies');
  console.log('- Instant execution on Elide');
  console.log('- ~45M+ downloads/week on npm!');
  console.log();

  console.log('💡 Polyglot Tips:');
  console.log('- Use in Python/Ruby/Java test output');
  console.log('- Consistent visual diffs across languages');
  console.log('- Perfect for polyglot test suites!');
}
