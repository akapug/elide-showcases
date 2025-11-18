/**
 * path-parse - Parse Path Strings
 *
 * Parse a path string into an object with root, dir, base, ext, and name.
 * **POLYGLOT SHOWCASE**: One path parser for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/path-parse (~5M+ downloads/week)
 *
 * Features:
 * - Parse paths into components
 * - Cross-platform compatible
 * - Handles Windows and Unix paths
 * - Simple, focused API
 * - Zero dependencies
 *
 * Use cases:
 * - File path manipulation
 * - Build tools
 * - Module resolution
 * - Path analysis
 */

export interface PathObject {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

export function parse(pathString: string): PathObject {
  if (typeof pathString !== 'string') {
    throw new TypeError('Path must be a string');
  }

  const result: PathObject = {
    root: '',
    dir: '',
    base: '',
    ext: '',
    name: ''
  };

  if (pathString.length === 0) return result;

  const isAbsolute = pathString.charCodeAt(0) === 47; // /
  let start = 0;

  if (isAbsolute) {
    result.root = '/';
    start = 1;
  } else if (pathString.length >= 2 && pathString.charCodeAt(1) === 58) { // :
    result.root = pathString.slice(0, 2);
    start = 2;
  }

  const end = pathString.length;
  let startDot = -1;
  let startPart = start;
  let end = pathString.length;
  let matchedSlash = true;
  let i = pathString.length - 1;
  let preDotState = 0;

  for (; i >= start; --i) {
    const code = pathString.charCodeAt(i);
    if (code === 47 || code === 92) { // / or \
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === pathString.length) {
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46) { // .
      if (startDot === -1) startDot = i;
      else if (preDotState !== 1) preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 || preDotState === 0 ||
      (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
    if (end !== -1) {
      result.base = result.name = pathString.slice(startPart, end);
    }
  } else {
    result.name = pathString.slice(startPart, startDot);
    result.base = pathString.slice(startPart, end);
    result.ext = pathString.slice(startDot, end);
  }

  if (startPart > 0 && startPart !== start) {
    result.dir = pathString.slice(0, startPart - 1);
  } else if (isAbsolute) {
    result.dir = '/';
  }

  return result;
}

export default parse;

if (import.meta.url.includes("elide-path-parse.ts")) {
  console.log("🔍 path-parse - Parse Path Strings (POLYGLOT!)\n");

  console.log("=== Example 1: Unix Path ===");
  console.log(parse("/home/user/file.txt"));
  console.log();

  console.log("=== Example 2: Windows Path ===");
  console.log(parse("C:\\path\\dir\\file.txt"));
  console.log();

  console.log("=== Example 3: Relative Path ===");
  console.log(parse("src/index.ts"));
  console.log();

  console.log("=== Example 4: No Extension ===");
  console.log(parse("/usr/bin/node"));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- File path manipulation");
  console.log("- Build tools");
  console.log("- Module resolution");
  console.log();

  console.log("🚀 Performance: ~5M+ downloads/week on npm!");
}
