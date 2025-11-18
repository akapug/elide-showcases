/**
 * anymatch - Match Against Mixed Patterns
 *
 * Match strings against various matchers (strings, regexes, functions)
 * Flexible matching for file watchers and build tools
 *
 * Popular package with ~120M downloads/week on npm!
 */

type Matcher = string | RegExp | ((input: string) => boolean);

interface AnymatchOptions {
  dot?: boolean;
  nocase?: boolean;
}

function globToRegex(pattern: string, options: AnymatchOptions = {}): RegExp {
  const { nocase = false } = options;
  let regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regexStr}$`, nocase ? 'i' : '');
}

export function anymatch(matchers: Matcher | Matcher[], input: string | string[], options: AnymatchOptions = {}): boolean {
  const matcherArray = Array.isArray(matchers) ? matchers : [matchers];
  const inputs = Array.isArray(input) ? input : [input];
  const { dot = false } = options;

  for (const testInput of inputs) {
    if (!dot && testInput.split('/').some(p => p.startsWith('.') && p !== '.')) {
      continue;
    }

    for (const matcher of matcherArray) {
      if (typeof matcher === 'string') {
        const regex = globToRegex(matcher, options);
        if (regex.test(testInput)) return true;
      } else if (matcher instanceof RegExp) {
        if (matcher.test(testInput)) return true;
      } else if (typeof matcher === 'function') {
        if (matcher(testInput)) return true;
      }
    }
  }

  return false;
}

// CLI Demo
if (import.meta.url.includes("elide-anymatch.ts")) {
  console.log("🎯 anymatch - Flexible Pattern Matching for Elide\n");
  console.log('anymatch("*.ts", "foo.ts")                    // true');
  console.log('anymatch(/\\.ts$/, "foo.ts")                   // true');
  console.log('anymatch((s) => s.length > 5, "foo.ts")       // true');
  console.log();
  console.log('anymatch(["*.ts", "*.js"], "foo.ts")          // true');
  console.log('anymatch(["*.ts", /\\.js$/], "foo.js")         // true');
  console.log();
  console.log("✅ Use Cases: File watchers, flexible filtering");
  console.log("🚀 ~120M downloads/week on npm");
}

export default anymatch;
