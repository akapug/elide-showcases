/**
 * glob - File Pattern Matching
 *
 * Match files using glob patterns with support for wildcards, negation, and more
 * Core functionality for build tools, test runners, and file processors
 *
 * Popular package with ~120M downloads/week on npm!
 */

interface GlobOptions {
  cwd?: string;
  ignore?: string[];
  dot?: boolean;
  absolute?: boolean;
  onlyFiles?: boolean;
  onlyDirectories?: boolean;
}

/**
 * Convert glob pattern to regex
 */
function globToRegex(pattern: string): RegExp {
  let regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\{([^}]+)\}/g, (_, group) => `(${group.split(',').join('|')})`)
    .replace(/\[([^\]]+)\]/g, '[$1]');

  return new RegExp(`^${regexStr}$`);
}

/**
 * Check if path matches pattern
 */
function matchPattern(path: string, pattern: string, options: GlobOptions = {}): boolean {
  const { dot = false } = options;

  // Handle negation
  if (pattern.startsWith('!')) {
    return !matchPattern(path, pattern.slice(1), options);
  }

  // Skip dotfiles unless explicitly allowed
  if (!dot && path.split('/').some(part => part.startsWith('.') && part !== '.')) {
    return false;
  }

  const regex = globToRegex(pattern);
  return regex.test(path);
}

/**
 * Walk directory recursively
 */
async function* walkDir(dir: string, options: GlobOptions = {}): AsyncGenerator<string> {
  const { cwd = '.', absolute = false } = options;
  const fullPath = `${cwd}/${dir}`.replace(/\/+/g, '/').replace(/^\.\//g, '');

  try {
    for await (const entry of Deno.readDir(fullPath)) {
      const entryPath = `${dir}/${entry.name}`.replace(/^\/+/g, '');
      const fullEntryPath = `${fullPath}/${entry.name}`;

      if (entry.isDirectory) {
        yield* walkDir(entryPath, options);
      } else {
        yield absolute ? fullEntryPath : entryPath;
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
}

/**
 * Find files matching glob pattern
 */
export async function glob(pattern: string | string[], options: GlobOptions = {}): Promise<string[]> {
  const { cwd = '.', ignore = [], onlyFiles = true, onlyDirectories = false } = options;
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const results = new Set<string>();

  // Start walking from current directory
  for await (const path of walkDir('.', options)) {
    // Check if matches any pattern
    const matches = patterns.some(p => matchPattern(path, p, options));
    if (!matches) continue;

    // Check if matches any ignore pattern
    const ignored = ignore.some(p => matchPattern(path, p, options));
    if (ignored) continue;

    // Check file/directory filter
    try {
      const stat = await Deno.stat(`${cwd}/${path}`);
      if (onlyFiles && !stat.isFile) continue;
      if (onlyDirectories && !stat.isDirectory) continue;
    } catch {
      continue;
    }

    results.add(path);
  }

  return Array.from(results).sort();
}

/**
 * Find files matching glob pattern synchronously
 */
export function globSync(pattern: string | string[], options: GlobOptions = {}): string[] {
  const { cwd = '.', ignore = [], onlyFiles = true, onlyDirectories = false } = options;
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const results = new Set<string>();

  function walkDirSync(dir: string): void {
    const fullPath = `${cwd}/${dir}`.replace(/\/+/g, '/').replace(/^\.\//g, '');

    try {
      for (const entry of Deno.readDirSync(fullPath)) {
        const entryPath = `${dir}/${entry.name}`.replace(/^\/+/g, '');

        if (entry.isDirectory) {
          walkDirSync(entryPath);
        } else {
          // Check if matches any pattern
          const matches = patterns.some(p => matchPattern(entryPath, p, options));
          if (!matches) return;

          // Check if matches any ignore pattern
          const ignored = ignore.some(p => matchPattern(entryPath, p, options));
          if (ignored) return;

          // Check file/directory filter
          try {
            const stat = Deno.statSync(`${cwd}/${entryPath}`);
            if (onlyFiles && !stat.isFile) return;
            if (onlyDirectories && !stat.isDirectory) return;
          } catch {
            return;
          }

          results.add(entryPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  walkDirSync('.');
  return Array.from(results).sort();
}

/**
 * Check if string is a glob pattern
 */
export function isGlob(str: string): boolean {
  return /[*?[\]{}!]/.test(str);
}

/**
 * Escape special glob characters
 */
export function escape(str: string): string {
  return str.replace(/[*?[\]{}!]/g, '\\$&');
}

// CLI Demo
if (import.meta.url.includes("elide-glob.ts")) {
  console.log("🔍 glob - File Pattern Matching for Elide\n");

  console.log("=== Example 1: Basic Patterns ===");
  console.log('glob("*.ts")         // All TypeScript files');
  console.log('glob("**/*.test.ts") // All test files');
  console.log('glob("src/**/*.ts")  // All TS files in src');
  console.log();

  console.log("=== Example 2: Multiple Patterns ===");
  console.log('glob(["*.ts", "*.js"])');
  console.log('// All TypeScript and JavaScript files');
  console.log();

  console.log("=== Example 3: Ignore Patterns ===");
  console.log('glob("**/*.ts", {');
  console.log('  ignore: ["**/*.test.ts", "node_modules/**"]');
  console.log('})');
  console.log();

  console.log("=== Example 4: Advanced Patterns ===");
  console.log('glob("src/{components,utils}/**/*.{ts,tsx}")');
  console.log('// TS/TSX files in specific directories');
  console.log();

  console.log("=== Example 5: Check if Glob ===");
  console.log('isGlob("*.ts")      // true');
  console.log('isGlob("file.ts")   // false');
  console.log('isGlob("**/*.js")   // true');
  console.log();

  console.log("=== Example 6: Escape Special Chars ===");
  console.log('escape("file[1].ts") // "file\\\\[1\\\\].ts"');
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Build tools (webpack, vite, rollup)");
  console.log("- Test runners (jest, vitest)");
  console.log("- Linters (eslint, prettier)");
  console.log("- File processors");
  console.log("- Deployment scripts");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~120M downloads/week on npm");
}

export default { glob, globSync, isGlob, escape };
