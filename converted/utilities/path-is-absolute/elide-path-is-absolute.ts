/**
 * path-is-absolute - Check if Path is Absolute
 *
 * Check whether a file path is absolute.
 * **POLYGLOT SHOWCASE**: One absolute path checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/path-is-absolute (~10M+ downloads/week)
 *
 * Features:
 * - Check if path is absolute
 * - Cross-platform (Windows and Unix)
 * - Simple API
 * - Zero dependencies
 */

export function isAbsolute(path: string): boolean {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string');
  }

  if (path.length === 0) return false;

  // Unix absolute path
  if (path.charCodeAt(0) === 47) return true; // /

  // Windows absolute path
  if (path.length > 2 && path.charCodeAt(1) === 58) { // :
    const code = path.charCodeAt(0);
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      // Check for backslash or forward slash after drive letter
      if (path.charCodeAt(2) === 92 || path.charCodeAt(2) === 47) {
        return true;
      }
    }
  }

  // Windows UNC path
  if (path.length >= 2 && path.charCodeAt(0) === 92 && path.charCodeAt(1) === 92) {
    return true;
  }

  return false;
}

export default isAbsolute;

if (import.meta.url.includes("elide-path-is-absolute.ts")) {
  console.log("✅ path-is-absolute - Check if Path is Absolute (POLYGLOT!)\n");

  console.log("=== Example 1: Unix Paths ===");
  console.log("/usr/local/bin:", isAbsolute("/usr/local/bin"));
  console.log("/home/user:", isAbsolute("/home/user"));
  console.log("relative/path:", isAbsolute("relative/path"));
  console.log("./current:", isAbsolute("./current"));
  console.log();

  console.log("=== Example 2: Windows Paths ===");
  console.log("C:\\Windows:", isAbsolute("C:\\Windows"));
  console.log("C:/Windows:", isAbsolute("C:/Windows"));
  console.log("D:\\Users:", isAbsolute("D:\\Users"));
  console.log("relative\\path:", isAbsolute("relative\\path"));
  console.log();

  console.log("=== Example 3: UNC Paths ===");
  console.log("\\\\server\\share:", isAbsolute("\\\\server\\share"));
  console.log();

  console.log("=== Example 4: Edge Cases ===");
  console.log("Empty string:", isAbsolute(""));
  console.log("Single slash:", isAbsolute("/"));
  console.log("Just drive:", isAbsolute("C:"));
  console.log();

  console.log("🚀 Performance: ~10M+ downloads/week on npm!");
}
