/**
 * path-dirname - Get Directory Name from Path
 *
 * Extract the directory portion of a file path.
 * **POLYGLOT SHOWCASE**: One dirname utility for ALL languages on Elide!
 *
 * Based on Node.js path.dirname (~100K+ downloads/week)
 *
 * Features:
 * - Extract directory from path
 * - Cross-platform compatible
 * - Handle trailing slashes
 * - Simple API
 * - Zero dependencies
 */

export function dirname(path: string): string {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string');
  }

  if (path.length === 0) return '.';

  const hasRoot = path.charCodeAt(0) === 47; // /
  let end = -1;
  let matchedSlash = true;

  for (let i = path.length - 1; i >= 1; --i) {
    if (path.charCodeAt(i) === 47 || path.charCodeAt(i) === 92) { // / or \
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else {
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) return '/';
  return path.slice(0, end);
}

export default dirname;

if (import.meta.url.includes("elide-path-dirname.ts")) {
  console.log("📂 path-dirname - Get Directory Name (POLYGLOT!)\n");

  console.log("dirname('/home/user/file.txt'):", dirname('/home/user/file.txt'));
  console.log("dirname('src/index.ts'):", dirname('src/index.ts'));
  console.log("dirname('/file.txt'):", dirname('/file.txt'));
  console.log("dirname('file.txt'):", dirname('file.txt'));
  console.log();

  console.log("🚀 Performance: ~100K+ downloads/week!");
}
