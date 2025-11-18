/**
 * glob-parent - Extract Parent Directory from Glob
 *
 * Extract the non-glob parent path from a glob string
 * Useful for determining the base directory for globbing
 *
 * Popular package with ~150M downloads/week on npm!
 */

export function globParent(pattern: string): string {
  if (!pattern || typeof pattern !== 'string') {
    return '.';
  }

  // Handle absolute paths
  const isAbsolute = pattern.startsWith('/');
  const parts = pattern.split('/').filter(p => p);

  // Find the first part that contains glob characters
  const globChars = /[*?[\]{}!]/;
  let parentParts: string[] = [];

  for (const part of parts) {
    // Check if this part contains unescaped glob characters
    if (globChars.test(part.replace(/\\./g, ''))) {
      break;
    }
    parentParts.push(part);
  }

  // Build the parent path
  if (parentParts.length === 0) {
    return isAbsolute ? '/' : '.';
  }

  const parent = isAbsolute ? '/' + parentParts.join('/') : parentParts.join('/');
  return parent || '.';
}

// CLI Demo
if (import.meta.url.includes("elide-glob-parent.ts")) {
  console.log("📂 glob-parent - Extract Parent from Glob for Elide\n");
  console.log('globParent("*.ts")               // "."');
  console.log('globParent("src/*.ts")           // "src"');
  console.log('globParent("src/**/*.ts")        // "src"');
  console.log('globParent("a/b/c/*.ts")         // "a/b/c"');
  console.log('globParent("/abs/path/*.ts")     // "/abs/path"');
  console.log('globParent("foo/{a,b}.ts")       // "foo"');
  console.log('globParent("**/*.ts")            // "."');
  console.log('globParent("/abs/**/*.ts")       // "/abs"');
  console.log();
  console.log("✅ Use Cases: Glob base detection, file watchers");
  console.log("🚀 ~150M downloads/week on npm");
}

export default globParent;
