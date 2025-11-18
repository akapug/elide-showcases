/**
 * upath - Universal Path Utilities
 *
 * Cross-platform path manipulation that works consistently on Windows, Mac, and Linux.
 * **POLYGLOT SHOWCASE**: One path library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/upath (~500K+ downloads/week)
 *
 * Features:
 * - Normalize Windows paths to Unix style
 * - Convert between path formats
 * - Cross-platform path operations
 * - Always forward slashes
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need path handling
 * - ONE implementation works everywhere on Elide
 * - Consistent path format across platforms
 * - No platform-specific code needed
 *
 * Use cases:
 * - Build tools (cross-platform builds)
 * - File operations (consistent paths)
 * - URL generation (always forward slashes)
 * - Path manipulation (join, resolve, etc.)
 *
 * Package has ~500K+ downloads/week on npm - essential build utility!
 */

const isWindows = typeof process !== 'undefined' && process.platform === 'win32';

/**
 * Normalize path to use forward slashes
 */
export function normalize(path: string): string {
  if (!path) return '.';

  // Replace backslashes with forward slashes
  let normalized = path.replace(/\\/g, '/');

  // Remove duplicate slashes
  normalized = normalized.replace(/\/+/g, '/');

  // Handle drive letters on Windows
  if (/^[a-zA-Z]:/.test(normalized)) {
    normalized = normalized.charAt(0).toLowerCase() + normalized.slice(1);
  }

  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || '.';
}

/**
 * Join path segments using forward slashes
 */
export function join(...paths: string[]): string {
  if (paths.length === 0) return '.';

  const joined = paths
    .filter(p => p && p.length > 0)
    .join('/');

  return normalize(joined);
}

/**
 * Convert Windows path to Unix style
 */
export function toUnix(path: string): string {
  if (!path) return '';

  // Replace backslashes with forward slashes
  let unixPath = path.replace(/\\/g, '/');

  // Remove drive letter
  unixPath = unixPath.replace(/^[a-zA-Z]:/, '');

  return unixPath;
}

/**
 * Add trailing slash if not present
 */
export function addTrailingSlash(path: string): string {
  if (!path) return '/';
  const normalized = normalize(path);
  return normalized.endsWith('/') ? normalized : normalized + '/';
}

/**
 * Remove trailing slash
 */
export function removeTrailingSlash(path: string): string {
  const normalized = normalize(path);
  return normalized.endsWith('/') && normalized.length > 1
    ? normalized.slice(0, -1)
    : normalized;
}

/**
 * Get directory name
 */
export function dirname(path: string): string {
  if (!path) return '.';

  const normalized = normalize(path);
  const lastSlash = normalized.lastIndexOf('/');

  if (lastSlash === -1) return '.';
  if (lastSlash === 0) return '/';

  return normalized.slice(0, lastSlash);
}

/**
 * Get basename (filename)
 */
export function basename(path: string, ext?: string): string {
  if (!path) return '';

  const normalized = normalize(path);
  const lastSlash = normalized.lastIndexOf('/');
  let base = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);

  if (ext && base.endsWith(ext)) {
    base = base.slice(0, -ext.length);
  }

  return base;
}

/**
 * Get file extension
 */
export function extname(path: string): string {
  if (!path) return '';

  const base = basename(path);
  const lastDot = base.lastIndexOf('.');

  if (lastDot === -1 || lastDot === 0) return '';

  return base.slice(lastDot);
}

/**
 * Check if path is absolute
 */
export function isAbsolute(path: string): boolean {
  if (!path) return false;

  // Unix absolute path
  if (path.startsWith('/')) return true;

  // Windows absolute path
  if (/^[a-zA-Z]:/.test(path)) return true;

  return false;
}

/**
 * Resolve path to absolute
 */
export function resolve(...paths: string[]): string {
  let resolved = '';
  let isAbsolutePath = false;

  for (let i = paths.length - 1; i >= 0 && !isAbsolutePath; i--) {
    const path = paths[i];
    if (!path) continue;

    resolved = path + '/' + resolved;
    isAbsolutePath = isAbsolute(path);
  }

  if (!isAbsolutePath && typeof process !== 'undefined') {
    resolved = process.cwd() + '/' + resolved;
  }

  return normalize(resolved);
}

/**
 * Get relative path from 'from' to 'to'
 */
export function relative(from: string, to: string): string {
  from = normalize(from);
  to = normalize(to);

  if (from === to) return '';

  const fromParts = from.split('/').filter(p => p);
  const toParts = to.split('/').filter(p => p);

  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++;
  }

  const upCount = fromParts.length - i;
  const remainingParts = toParts.slice(i);

  const ups = Array(upCount).fill('..');
  return [...ups, ...remainingParts].join('/') || '.';
}

/**
 * Default export with all functions
 */
const upath = {
  normalize,
  join,
  toUnix,
  addTrailingSlash,
  removeTrailingSlash,
  dirname,
  basename,
  extname,
  isAbsolute,
  resolve,
  relative,
};

export default upath;

// CLI Demo
if (import.meta.url.includes("elide-upath.ts")) {
  console.log("📁 upath - Universal Path Utilities for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Normalize Paths ===");
  console.log("Windows path:", normalize("C:\\Users\\John\\Documents\\file.txt"));
  console.log("Mixed slashes:", normalize("path//to///file.txt"));
  console.log("Relative path:", normalize("./path/to/file.txt"));
  console.log();

  console.log("=== Example 2: Join Paths ===");
  console.log("Join segments:", join("path", "to", "file.txt"));
  console.log("With empty:", join("path", "", "to", "file.txt"));
  console.log("Mixed slashes:", join("path/", "/to/", "/file.txt"));
  console.log();

  console.log("=== Example 3: Windows to Unix ===");
  console.log("Remove drive:", toUnix("C:\\Users\\John\\file.txt"));
  console.log("Backslashes:", toUnix("path\\to\\file.txt"));
  console.log();

  console.log("=== Example 4: Trailing Slashes ===");
  console.log("Add trailing:", addTrailingSlash("path/to/dir"));
  console.log("Remove trailing:", removeTrailingSlash("path/to/dir/"));
  console.log("Already has:", addTrailingSlash("path/to/dir/"));
  console.log();

  console.log("=== Example 5: Path Components ===");
  const testPath = "path/to/file.txt";
  console.log("Full path:", testPath);
  console.log("Directory:", dirname(testPath));
  console.log("Basename:", basename(testPath));
  console.log("Extension:", extname(testPath));
  console.log("Without ext:", basename(testPath, ".txt"));
  console.log();

  console.log("=== Example 6: Absolute Paths ===");
  console.log("Unix absolute:", isAbsolute("/usr/local/bin"));
  console.log("Windows absolute:", isAbsolute("C:/Users/John"));
  console.log("Relative:", isAbsolute("path/to/file"));
  console.log();

  console.log("=== Example 7: Relative Paths ===");
  console.log("From /a/b to /a/c:", relative("/a/b", "/a/c"));
  console.log("From /a/b to /a/b/c:", relative("/a/b", "/a/b/c"));
  console.log("From /a/b/c to /a:", relative("/a/b/c", "/a"));
  console.log();

  console.log("=== Example 8: Real-World Use Cases ===");

  // Build tool paths
  const srcPath = join("src", "components", "Button.tsx");
  const distPath = join("dist", "components", "Button.js");
  console.log("Source:", srcPath);
  console.log("Output:", distPath);
  console.log();

  // URL generation
  const baseUrl = "https://example.com";
  const apiPath = join("api", "v1", "users");
  console.log("API URL:", `${baseUrl}/${apiPath}`);
  console.log();

  // Cross-platform file paths
  const windowsPath = "C:\\Program Files\\App\\config.json";
  const unixPath = toUnix(windowsPath);
  console.log("Windows:", windowsPath);
  console.log("Unix:", unixPath);
  console.log();

  console.log("=== Example 9: POLYGLOT Use Case ===");
  console.log("🌐 Same upath library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One path format everywhere");
  console.log("  ✓ No platform-specific code");
  console.log("  ✓ Consistent across all services");
  console.log("  ✓ Always forward slashes");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Build tools (webpack, rollup, vite)");
  console.log("- File operations (consistent paths)");
  console.log("- URL generation (API routes)");
  console.log("- Cross-platform apps (Windows + Mac + Linux)");
  console.log("- Path manipulation (join, resolve, etc.)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- ~500K+ downloads/week on npm!");
  console.log();
}
