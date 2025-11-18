/**
 * path-key - Get the PATH Environment Variable Key
 *
 * Get the correct PATH key for the current platform (PATH or Path).
 * **POLYGLOT SHOWCASE**: One PATH key getter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/path-key (~10M+ downloads/week)
 *
 * Features:
 * - Get correct PATH environment variable key
 * - Cross-platform (Unix uses PATH, Windows uses Path)
 * - Custom environment object support
 * - Simple API
 * - Zero dependencies
 */

export interface PathKeyOptions {
  env?: Record<string, string | undefined>;
  platform?: string;
}

export function pathKey(options: PathKeyOptions = {}): string {
  const env = options.env || process.env;
  const platform = options.platform || process.platform;

  if (platform === 'win32') {
    // Windows is case-insensitive, find the actual key
    for (const key of Object.keys(env)) {
      if (key.toLowerCase() === 'path') {
        return key;
      }
    }
    return 'Path';
  }

  return 'PATH';
}

export default pathKey;

if (import.meta.url.includes("elide-path-key.ts")) {
  console.log("🔑 path-key - Get PATH Environment Variable Key (POLYGLOT!)\n");

  console.log("=== Example 1: Current Platform ===");
  console.log("Platform:", process.platform);
  console.log("PATH key:", pathKey());
  console.log("PATH value:", process.env[pathKey()]?.substring(0, 100) + '...');
  console.log();

  console.log("=== Example 2: Specific Platform ===");
  console.log("Windows PATH key:", pathKey({ platform: 'win32' }));
  console.log("Unix PATH key:", pathKey({ platform: 'linux' }));
  console.log();

  console.log("=== Example 3: Custom Environment ===");
  const customEnv = { Path: 'C:\\Windows\\System32' };
  console.log("Custom env PATH key:", pathKey({ env: customEnv, platform: 'win32' }));
  console.log();

  console.log("🚀 Performance: ~10M+ downloads/week on npm!");
}
