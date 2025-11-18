/**
 * path-is-inside - Check if Path is Inside Another
 *
 * Check if a path is inside another path.
 * **POLYGLOT SHOWCASE**: One path containment checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/path-is-inside (~2M+ downloads/week)
 *
 * Features:
 * - Check path containment
 * - Cross-platform compatible
 * - Resolve relative paths
 * - Simple API
 * - Zero dependencies
 */

const path = await import('node:path');

export function isInside(childPath: string, parentPath: string): boolean {
  if (typeof childPath !== 'string' || typeof parentPath !== 'string') {
    throw new TypeError('Paths must be strings');
  }

  const child = path.resolve(childPath);
  const parent = path.resolve(parentPath);

  if (child === parent) return false;

  const parentTokens = parent.split(path.sep).filter(i => i.length);
  const childTokens = child.split(path.sep).filter(i => i.length);

  if (parentTokens.length >= childTokens.length) return false;

  return parentTokens.every((t, i) => childTokens[i] === t);
}

export default isInside;

if (import.meta.url.includes("elide-path-is-inside.ts")) {
  console.log("📍 path-is-inside - Check Path Containment (POLYGLOT!)\n");

  console.log("=== Example 1: Check Containment ===");
  console.log("'/home/user/docs' inside '/home/user':", isInside('/home/user/docs', '/home/user'));
  console.log("'/home/user' inside '/home/user/docs':", isInside('/home/user', '/home/user/docs'));
  console.log();

  console.log("=== Example 2: Same Path ===");
  console.log("'/home/user' inside '/home/user':", isInside('/home/user', '/home/user'));
  console.log();

  console.log("🚀 Performance: ~2M+ downloads/week on npm!");
}
