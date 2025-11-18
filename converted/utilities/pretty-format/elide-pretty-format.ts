/**
 * pretty-format - Serialize values for testing
 *
 * Convert any JavaScript value to a readable string representation.
 * **POLYGLOT SHOWCASE**: Value serialization for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/pretty-format (~45M+ downloads/week)
 *
 * Features:
 * - Object/array formatting
 * - Function serialization
 * - Circular reference handling
 * - Custom indent/colors
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need value formatting
 * - ONE serializer works everywhere on Elide
 * - Consistent debug output
 * - Share formatters across languages
 *
 * Use cases:
 * - Test snapshots
 * - Debug output
 * - Logging
 * - Value comparison
 *
 * Package has ~45M+ downloads/week on npm!
 */

export interface PrettyFormatOptions {
  callToJSON?: boolean;
  escapeRegex?: boolean;
  escapeString?: boolean;
  highlight?: boolean;
  indent?: number;
  maxDepth?: number;
  min?: boolean;
  printFunctionName?: boolean;
  theme?: Theme;
}

export interface Theme {
  comment?: string;
  content?: string;
  prop?: string;
  tag?: string;
  value?: string;
}

const DEFAULT_THEME: Theme = {
  comment: '\x1b[90m', // Gray
  content: '\x1b[37m', // White
  prop: '\x1b[33m', // Yellow
  tag: '\x1b[36m', // Cyan
  value: '\x1b[32m', // Green
};

const RESET = '\x1b[0m';

/**
 * Format any value to a pretty string
 */
export function format(value: any, options: PrettyFormatOptions = {}): string {
  const {
    callToJSON = true,
    escapeRegex = false,
    escapeString = true,
    highlight = true,
    indent = 2,
    maxDepth = Infinity,
    min = false,
    printFunctionName = true,
    theme = DEFAULT_THEME,
  } = options;

  const refs = new WeakSet();

  function printer(
    val: any,
    currentIndent: string,
    depth: number
  ): string {
    // Max depth check
    if (depth > maxDepth) {
      return color('[...]', theme.comment);
    }

    // Circular reference check
    if (val !== null && typeof val === 'object') {
      if (refs.has(val)) {
        return color('[Circular]', theme.comment);
      }
      refs.add(val);
    }

    // null and undefined
    if (val === null) {
      return color('null', theme.value);
    }
    if (val === undefined) {
      return color('undefined', theme.value);
    }

    // Primitives
    if (typeof val === 'boolean') {
      return color(String(val), theme.value);
    }
    if (typeof val === 'number') {
      return color(String(val), theme.value);
    }
    if (typeof val === 'bigint') {
      return color(`${val}n`, theme.value);
    }
    if (typeof val === 'string') {
      const escaped = escapeString ? escapeStr(val) : val;
      return color(`"${escaped}"`, theme.value);
    }
    if (typeof val === 'symbol') {
      return color(val.toString(), theme.value);
    }

    // Functions
    if (typeof val === 'function') {
      const name = printFunctionName ? val.name || 'anonymous' : '';
      return color(`[Function${name ? ': ' + name : ''}]`, theme.tag);
    }

    // RegExp
    if (val instanceof RegExp) {
      const str = escapeRegex ? escapeStr(val.source) : val.source;
      return color(`/${str}/${val.flags}`, theme.value);
    }

    // Date
    if (val instanceof Date) {
      const iso = val.toISOString();
      return color(`Date("${iso}")`, theme.tag);
    }

    // Error
    if (val instanceof Error) {
      return color(`[${val.name}: ${val.message}]`, theme.tag);
    }

    // Array
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return color('[]', theme.content);
      }

      const nextIndent = currentIndent + ' '.repeat(indent);
      const items = val.map((item) =>
        printer(item, nextIndent, depth + 1)
      );

      if (min) {
        return color('[', theme.content) + items.join(', ') + color(']', theme.content);
      }

      return (
        color('[', theme.content) +
        '\n' +
        items.map((item) => `${nextIndent}${item},`).join('\n') +
        '\n' +
        currentIndent +
        color(']', theme.content)
      );
    }

    // toJSON support
    if (callToJSON && typeof val.toJSON === 'function') {
      return printer(val.toJSON(), currentIndent, depth);
    }

    // Object
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) {
        return color('{}', theme.content);
      }

      const nextIndent = currentIndent + ' '.repeat(indent);
      const items = keys.map((key) => {
        const propName = color(key, theme.prop);
        const propValue = printer(val[key], nextIndent, depth + 1);
        return min
          ? `${propName}: ${propValue}`
          : `${nextIndent}${propName}: ${propValue},`;
      });

      if (min) {
        return color('{', theme.content) + items.join(', ') + color('}', theme.content);
      }

      return (
        color('{', theme.content) +
        '\n' +
        items.join('\n') +
        '\n' +
        currentIndent +
        color('}', theme.content)
      );
    }

    return String(val);
  }

  function color(str: string, colorCode?: string): string {
    if (!highlight || !colorCode) return str;
    return `${colorCode}${str}${RESET}`;
  }

  return printer(value, '', 0);
}

/**
 * Escape special characters in strings
 */
function escapeStr(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Compact format (single line)
 */
export function formatCompact(value: any, options: PrettyFormatOptions = {}): string {
  return format(value, { ...options, min: true, indent: 0 });
}

/**
 * Format without colors
 */
export function formatPlain(value: any, options: PrettyFormatOptions = {}): string {
  return format(value, { ...options, highlight: false });
}

export default format;

// CLI Demo
if (import.meta.url.includes('elide-pretty-format.ts')) {
  console.log('🎨 pretty-format - Value Serialization for Elide (POLYGLOT!)\n');

  // Example 1: Basic values
  console.log('Example 1: Basic Values\n');
  console.log(format(null));
  console.log(format(undefined));
  console.log(format(true));
  console.log(format(42));
  console.log(format('Hello World'));
  console.log();

  // Example 2: Objects
  console.log('Example 2: Object Formatting\n');
  const obj = {
    name: 'Alice',
    age: 30,
    active: true,
    tags: ['admin', 'user'],
  };
  console.log(format(obj));
  console.log();

  // Example 3: Arrays
  console.log('Example 3: Array Formatting\n');
  const arr = [1, 'two', { three: 3 }, [4, 5]];
  console.log(format(arr));
  console.log();

  // Example 4: Nested structures
  console.log('Example 4: Nested Objects\n');
  const nested = {
    user: {
      profile: {
        name: 'Bob',
        settings: {
          theme: 'dark',
          notifications: true,
        },
      },
    },
  };
  console.log(format(nested));
  console.log();

  // Example 5: Special types
  console.log('Example 5: Special Types\n');
  console.log(format(new Date('2024-01-01')));
  console.log(format(/hello\w+/gi));
  console.log(format(() => 'test'));
  console.log(format(new Error('Oops!')));
  console.log();

  // Example 6: Compact format
  console.log('Example 6: Compact Format\n');
  console.log(formatCompact({ a: 1, b: 2, c: [3, 4, 5] }));
  console.log();

  // Example 7: Max depth
  console.log('Example 7: Max Depth Control\n');
  const deep = { a: { b: { c: { d: { e: 'too deep!' } } } } };
  console.log(format(deep, { maxDepth: 2 }));
  console.log();

  // Example 8: Circular references
  console.log('Example 8: Circular References\n');
  const circular: any = { name: 'circular' };
  circular.self = circular;
  console.log(format(circular));
  console.log();

  console.log('✅ Use Cases:');
  console.log('- Test snapshots and comparisons');
  console.log('- Debug output and logging');
  console.log('- Value serialization');
  console.log('- Pretty printing data');
  console.log();

  console.log('🚀 Performance:');
  console.log('- Zero dependencies');
  console.log('- Handles circular references');
  console.log('- ~45M+ downloads/week on npm!');
  console.log();

  console.log('💡 Polyglot Tips:');
  console.log('- Format values from any language');
  console.log('- Consistent debug output everywhere');
  console.log('- Perfect for polyglot logging!');
}
