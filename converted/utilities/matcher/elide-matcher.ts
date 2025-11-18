/**
 * matcher - Simple Wildcard Matching
 *
 * Simple pattern matching with wildcards
 * Lightweight alternative for basic matching needs
 *
 * Popular package with ~5M downloads/week on npm!
 */

interface MatcherOptions {
  caseSensitive?: boolean;
}

function wildcardToRegex(pattern: string, caseSensitive: boolean): RegExp {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regexStr}$`, caseSensitive ? '' : 'i');
}

export function matcher(patterns: string | string[], options: MatcherOptions = {}): (input: string) => boolean {
  const { caseSensitive = true } = options;
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  const regexes = patternArray.map(p => wildcardToRegex(p, caseSensitive));

  return (input: string) => regexes.some(regex => regex.test(input));
}

export function isMatch(input: string, patterns: string | string[], options: MatcherOptions = {}): boolean {
  const match = matcher(patterns, options);
  return match(input);
}

// CLI Demo
if (import.meta.url.includes("elide-matcher.ts")) {
  console.log("🎯 matcher - Simple Wildcard Matching for Elide\n");
  console.log('const match = matcher("*.ts")');
  console.log('match("foo.ts")  // true');
  console.log('match("foo.js")  // false');
  console.log();
  console.log('isMatch("FOO.TS", "*.ts", { caseSensitive: false })  // true');
  console.log();
  console.log("✅ Use Cases: Simple pattern matching, file filtering");
  console.log("🚀 ~5M downloads/week on npm");
}

export default matcher;
export { matcher, isMatch };
