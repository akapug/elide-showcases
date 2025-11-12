/**
 * Glob - Match files using patterns
 * Based on https://www.npmjs.com/package/glob (~18M downloads/week)
 */

export function glob(pattern: string, options?: { cwd?: string; ignore?: string[] }): string[] {
  // Simplified implementation
  // In production, use Elide's file system APIs
  console.log(`Glob pattern: ${pattern}`);
  console.log(`Options:`, options);

  // This is a placeholder that demonstrates the API
  return [];
}

export function globSync(pattern: string, options?: { cwd?: string; ignore?: string[] }): string[] {
  return glob(pattern, options);
}

export default glob;

if (import.meta.url.includes("glob.ts")) {
  console.log("📁 Glob - File pattern matching for Elide\n");
  console.log("Features: Pattern matching, file discovery");
  console.log("Examples:");
  console.log("  glob('**/*.ts')  - Find all TypeScript files");
  console.log("  glob('src/**/*') - Find all files in src");
  console.log("~18M+ downloads/week on npm!");
}
