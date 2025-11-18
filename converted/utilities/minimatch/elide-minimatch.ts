/**
 * minimatch - Glob Pattern Matcher
 *
 * Match files using glob expressions
 * Core matching library for many glob tools
 *
 * Popular package with ~150M downloads/week on npm!
 */

interface MinimatchOptions {
  dot?: boolean;
  nocase?: boolean;
  matchBase?: boolean;
  flipNegate?: boolean;
}

function globToRegex(pattern: string, options: MinimatchOptions = {}): RegExp {
  const { nocase = false } = options;
  let regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\{([^}]+)\}/g, (_, group) => `(${group.split(',').join('|')})`);

  return new RegExp(`^${regexStr}$`, nocase ? 'i' : '');
}

export function minimatch(path: string, pattern: string, options: MinimatchOptions = {}): boolean {
  const { dot = false } = options;

  if (!dot && path.split('/').some(p => p.startsWith('.') && p !== '.')) {
    return false;
  }

  const regex = globToRegex(pattern, options);
  return regex.test(path);
}

export function filter(pattern: string, options: MinimatchOptions = {}): (path: string) => boolean {
  return (path: string) => minimatch(path, pattern, options);
}

export function match(paths: string[], pattern: string, options: MinimatchOptions = {}): string[] {
  return paths.filter(path => minimatch(path, pattern, options));
}

// CLI Demo
if (import.meta.url.includes("elide-minimatch.ts")) {
  console.log("🎯 minimatch - Glob Pattern Matching for Elide\n");
  console.log('minimatch("foo.ts", "*.ts")        // true');
  console.log('minimatch("foo.ts", "*.js")        // false');
  console.log('minimatch("a/b/c.ts", "**/*.ts")   // true');
  console.log();
  console.log("✅ Use Cases: File filtering, pattern matching");
  console.log("🚀 ~150M downloads/week on npm");
}

export default minimatch;
export { minimatch, filter, match };
