/**
 * multimatch - Match Against Multiple Patterns
 *
 * Filter arrays against multiple glob patterns
 * Supports both inclusion and exclusion patterns
 *
 * Popular package with ~15M downloads/week on npm!
 */

interface MultimatchOptions {
  dot?: boolean;
  nocase?: boolean;
}

function globToRegex(pattern: string, options: MultimatchOptions = {}): RegExp {
  const { nocase = false } = options;
  let regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regexStr}$`, nocase ? 'i' : '');
}

export function multimatch(paths: string | string[], patterns: string | string[], options: MultimatchOptions = {}): string[] {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  const { dot = false } = options;

  const positivePatterns = patternArray.filter(p => !p.startsWith('!'));
  const negativePatterns = patternArray.filter(p => p.startsWith('!')).map(p => p.slice(1));

  const results: string[] = [];

  for (const path of pathArray) {
    if (!dot && path.split('/').some(p => p.startsWith('.') && p !== '.')) {
      continue;
    }

    // Must match at least one positive pattern
    if (positivePatterns.length > 0) {
      const matchesPositive = positivePatterns.some(pattern => {
        const regex = globToRegex(pattern, options);
        return regex.test(path);
      });
      if (!matchesPositive) continue;
    }

    // Must not match any negative pattern
    const matchesNegative = negativePatterns.some(pattern => {
      const regex = globToRegex(pattern, options);
      return regex.test(path);
    });
    if (matchesNegative) continue;

    results.push(path);
  }

  return results;
}

// CLI Demo
if (import.meta.url.includes("elide-multimatch.ts")) {
  console.log("🎯 multimatch - Multiple Pattern Matching for Elide\n");
  console.log('const files = ["foo.ts", "bar.js", "test.ts"]');
  console.log('multimatch(files, ["*.ts", "!test.ts"])');
  console.log('// Result: ["foo.ts"]');
  console.log();
  console.log('multimatch(files, ["*.ts", "*.js"])');
  console.log('// Result: ["foo.ts", "bar.js", "test.ts"]');
  console.log();
  console.log("✅ Use Cases: File filtering, build pipelines");
  console.log("🚀 ~15M downloads/week on npm");
}

export default multimatch;
