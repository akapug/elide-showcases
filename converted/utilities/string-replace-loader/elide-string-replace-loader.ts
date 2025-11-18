/**
 * String Replace Loader - String Replacement
 *
 * Replace strings in files during webpack build.
 * **POLYGLOT SHOWCASE**: String replacement for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/string-replace-loader (~300K+ downloads/week)
 *
 * Features:
 * - String/regex replacement
 * - Multiple replacements
 * - Function replacements
 * - Conditional replacement
 * - Build-time transformations
 * - Zero dependencies core
 *
 * Package has ~300K+ downloads/week on npm!
 */

export interface ReplaceRule {
  search: string | RegExp;
  replace: string | ((match: string, ...args: any[]) => string);
  flags?: string;
  strict?: boolean;
}

export interface StringReplaceOptions {
  multiple?: ReplaceRule[];
  search?: string | RegExp;
  replace?: string | ((match: string) => string);
  flags?: string;
}

export class StringReplaceLoader {
  private options: StringReplaceOptions;

  constructor(options: StringReplaceOptions = {}) {
    this.options = options;
  }

  replace(source: string): string {
    let result = source;

    // Handle single replacement
    if (this.options.search && this.options.replace) {
      result = this.performReplace(result, {
        search: this.options.search,
        replace: this.options.replace,
        flags: this.options.flags,
      });
    }

    // Handle multiple replacements
    if (this.options.multiple) {
      this.options.multiple.forEach(rule => {
        result = this.performReplace(result, rule);
      });
    }

    return result;
  }

  private performReplace(source: string, rule: ReplaceRule): string {
    const { search, replace, flags } = rule;

    if (typeof search === 'string') {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags || 'g');

      if (typeof replace === 'function') {
        return source.replace(regex, replace as any);
      } else {
        return source.replace(regex, replace);
      }
    } else {
      if (typeof replace === 'function') {
        return source.replace(search, replace as any);
      } else {
        return source.replace(search, replace);
      }
    }
  }
}

export function replaceStrings(source: string, options: StringReplaceOptions): string {
  const loader = new StringReplaceLoader(options);
  return loader.replace(source);
}

export default StringReplaceLoader;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 String Replace Loader - String Replacement for Elide (POLYGLOT!)\n");

  const source = `
    const API_URL = '__API_URL__';
    const VERSION = '__VERSION__';
    const DEBUG = __DEBUG__;
  `;

  console.log("=== Example 1: Simple Replacement ===");
  const result1 = replaceStrings(source, {
    search: '__API_URL__',
    replace: 'https://api.example.com',
  });
  console.log(result1);

  console.log("\n=== Example 2: Multiple Replacements ===");
  const result2 = replaceStrings(source, {
    multiple: [
      { search: '__API_URL__', replace: 'https://api.example.com' },
      { search: '__VERSION__', replace: '1.0.0' },
      { search: '__DEBUG__', replace: 'true' },
    ],
  });
  console.log(result2);

  console.log("\n=== Example 3: Regex Replacement ===");
  const code = 'console.log("debug"); console.warn("warning"); console.error("error");';
  const result3 = replaceStrings(code, {
    search: /console\.(log|warn|error)/g,
    replace: 'noop',
  });
  console.log("Original:", code);
  console.log("Replaced:", result3);
  console.log();

  console.log("=== Example 4: Function Replacement ===");
  const result4 = replaceStrings('value: 123, value: 456', {
    search: /value: (\d+)/g,
    replace: (match, num) => `value: ${parseInt(num) * 2}`,
  });
  console.log(result4);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Replace build-time constants");
  console.log("- Environment-specific values");
  console.log("- Remove debug code");
  console.log("- ~300K+ downloads/week!");
}
