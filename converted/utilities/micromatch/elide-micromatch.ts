/**
 * micromatch - Advanced Glob Matching
 *
 * Powerful glob matching with extended features
 * Faster alternative to minimatch with more features
 *
 * Popular package with ~120M downloads/week on npm!
 */

interface MicromatchOptions {
  dot?: boolean;
  nocase?: boolean;
  matchBase?: boolean;
  contains?: boolean;
}

function globToRegex(pattern: string, options: MicromatchOptions = {}): RegExp {
  const { nocase = false, contains = false } = options;
  let regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\{([^}]+)\}/g, (_, group) => `(${group.split(',').join('|')})`)
    .replace(/\[([^\]]+)\]/g, '[$1]');

  if (!contains) {
    regexStr = `^${regexStr}$`;
  }

  return new RegExp(regexStr, nocase ? 'i' : '');
}

export function micromatch(paths: string | string[], patterns: string | string[], options: MicromatchOptions = {}): string[] {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  const { dot = false } = options;
  const results: string[] = [];

  for (const path of pathArray) {
    if (!dot && path.split('/').some(p => p.startsWith('.') && p !== '.')) {
      continue;
    }

    const matches = patternArray.some(pattern => {
      const regex = globToRegex(pattern, options);
      return regex.test(path);
    });

    if (matches) {
      results.push(path);
    }
  }

  return results;
}

export function isMatch(path: string, patterns: string | string[], options: MicromatchOptions = {}): boolean {
  return micromatch([path], patterns, options).length > 0;
}

export function not(paths: string[], patterns: string | string[], options: MicromatchOptions = {}): string[] {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  return paths.filter(path => !isMatch(path, patternArray, options));
}

// CLI Demo
if (import.meta.url.includes("elide-micromatch.ts")) {
  console.log("⚡ micromatch - Advanced Glob Matching for Elide\n");
  console.log('micromatch(["foo.ts", "bar.js"], "*.ts")  // ["foo.ts"]');
  console.log('isMatch("a/b/c.ts", "**/*.ts")           // true');
  console.log();
  console.log("✅ Use Cases: File filtering, build tools, linters");
  console.log("🚀 ~120M downloads/week on npm");
}

export default micromatch;
export { micromatch, isMatch, not };
