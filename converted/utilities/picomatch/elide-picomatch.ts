/**
 * picomatch - Fast Glob Matcher
 *
 * Blazing fast glob matching with minimal overhead
 * Used by many popular tools for pattern matching
 *
 * Popular package with ~150M downloads/week on npm!
 */

interface PicomatchOptions {
  dot?: boolean;
  nocase?: boolean;
  bash?: boolean;
  contains?: boolean;
}

interface PicomatchMatcher {
  (input: string): boolean;
  regex: RegExp;
}

function compile(pattern: string, options: PicomatchOptions = {}): RegExp {
  const { nocase = false, contains = false } = options;
  let regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\{([^}]+)\}/g, (_, group) => `(${group.split(',').join('|')})`);

  if (!contains) {
    regexStr = `^${regexStr}$`;
  }

  return new RegExp(regexStr, nocase ? 'i' : '');
}

export function picomatch(pattern: string, options: PicomatchOptions = {}): PicomatchMatcher {
  const { dot = false } = options;
  const regex = compile(pattern, options);

  const matcher = ((input: string) => {
    if (!dot && input.split('/').some(p => p.startsWith('.') && p !== '.')) {
      return false;
    }
    return regex.test(input);
  }) as PicomatchMatcher;

  matcher.regex = regex;
  return matcher;
}

export function isMatch(input: string, pattern: string, options: PicomatchOptions = {}): boolean {
  const matcher = picomatch(pattern, options);
  return matcher(input);
}

export function makeRe(pattern: string, options: PicomatchOptions = {}): RegExp {
  return compile(pattern, options);
}

// CLI Demo
if (import.meta.url.includes("elide-picomatch.ts")) {
  console.log("⚡ picomatch - Blazing Fast Glob Matching for Elide\n");
  console.log('const matcher = picomatch("*.ts")');
  console.log('matcher("foo.ts")  // true');
  console.log('matcher("foo.js")  // false');
  console.log();
  console.log('isMatch("a/b/c.ts", "**/*.ts")  // true');
  console.log();
  console.log("✅ Use Cases: High-performance matching, build tools");
  console.log("🚀 ~150M downloads/week on npm");
}

export default picomatch;
export { picomatch, isMatch, makeRe };
