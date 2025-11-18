/**
 * Is Path Inside - Check if Path is Inside Another
 *
 * Check if a path is inside another path.
 * **POLYGLOT SHOWCASE**: Path checking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-path-inside (~20M+ downloads/week)
 *
 * Features:
 * - Check path containment
 * - Resolve relative paths
 * - Cross-platform support
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~20M+ downloads/week on npm!
 */

import * as path from 'path';

export function isPathInside(childPath: string, parentPath: string): boolean {
  const childResolved = path.resolve(childPath);
  const parentResolved = path.resolve(parentPath);

  if (childResolved === parentResolved) {
    return false;
  }

  const relative = path.relative(parentResolved, childResolved);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export default isPathInside;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📂 Is Path Inside - Path Checking (POLYGLOT!)\n");

  console.log("/home/user/project is inside /home/user:",
    isPathInside('/home/user/project', '/home/user'));

  console.log("/home/user is inside /home/user/project:",
    isPathInside('/home/user', '/home/user/project'));

  console.log("/tmp is inside /home:",
    isPathInside('/tmp', '/home'));

  console.log("\n🚀 ~20M+ downloads/week on npm!");
}
