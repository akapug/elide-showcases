/**
 * is-path-cwd - Check if Path is Current Working Directory
 *
 * Check if a given path is the current working directory.
 * **POLYGLOT SHOWCASE**: One CWD checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-path-cwd (~500K+ downloads/week)
 *
 * Features:
 * - Check if path is CWD
 * - Resolve relative paths
 * - Cross-platform compatible
 * - Simple API
 * - Zero dependencies
 */

const path = await import('node:path');

export function isPathCwd(checkPath: string): boolean {
  if (typeof checkPath !== 'string') {
    throw new TypeError('Path must be a string');
  }

  const cwd = process.cwd();
  const resolved = path.resolve(checkPath);

  return resolved === cwd;
}

export default isPathCwd;

if (import.meta.url.includes("elide-is-path-cwd.ts")) {
  console.log("📂 is-path-cwd - Check if Path is CWD (POLYGLOT!)\n");

  console.log("=== Example 1: Check CWD ===");
  console.log("Current directory:", process.cwd());
  console.log("'.' is CWD:", isPathCwd('.'));
  console.log("process.cwd() is CWD:", isPathCwd(process.cwd()));
  console.log();

  console.log("=== Example 2: Different Path ===");
  console.log("'/tmp' is CWD:", isPathCwd('/tmp'));
  console.log();

  console.log("🚀 Performance: ~500K+ downloads/week on npm!");
}
