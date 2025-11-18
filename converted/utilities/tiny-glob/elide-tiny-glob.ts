/**
 * tiny-glob - Tiny Fast Glob Matcher
 *
 * Lightweight glob matching with minimal footprint
 * Fast and efficient for simple glob patterns
 *
 * Popular package with ~8M downloads/week on npm!
 */

interface TinyGlobOptions {
  cwd?: string;
  dot?: boolean;
  absolute?: boolean;
  filesOnly?: boolean;
  flush?: boolean;
}

function globToRegex(pattern: string): RegExp {
  return new RegExp(`^${pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '§§GLOBSTAR§§')
    .replace(/\*/g, '[^/]*')
    .replace(/§§GLOBSTAR§§/g, '.*')
    .replace(/\?/g, '.')}$`);
}

async function* walk(dir: string, cwd: string): AsyncGenerator<string> {
  const fullPath = `${cwd}/${dir}`.replace(/\/+/g, '/').replace(/^\.\//g, '');
  try {
    for await (const entry of Deno.readDir(fullPath)) {
      const path = `${dir}/${entry.name}`.replace(/^\/+/g, '');
      if (entry.isDirectory) {
        yield* walk(path, cwd);
      } else {
        yield path;
      }
    }
  } catch {
    // Ignore
  }
}

export async function tinyGlob(pattern: string, options: TinyGlobOptions = {}): Promise<string[]> {
  const { cwd = '.', dot = false, absolute = false } = options;
  const regex = globToRegex(pattern);
  const results: string[] = [];

  for await (const path of walk('.', cwd)) {
    if (!dot && path.split('/').some(p => p.startsWith('.') && p !== '.')) continue;
    if (!regex.test(path)) continue;
    results.push(absolute ? `${cwd}/${path}` : path);
  }

  return results.sort();
}

// CLI Demo
if (import.meta.url.includes("elide-tiny-glob.ts")) {
  console.log("🔍 tiny-glob - Lightweight Glob Matching for Elide\n");
  console.log('const files = await tinyGlob("**/*.ts")');
  console.log();
  console.log("✅ Use Cases: Simple file matching, build scripts");
  console.log("🚀 ~8M downloads/week on npm");
}

export default tinyGlob;
