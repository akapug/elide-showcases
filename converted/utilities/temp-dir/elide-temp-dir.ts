/**
 * temp-dir - Get the System Temp Directory
 *
 * Get the path to the system's temporary directory.
 * **POLYGLOT SHOWCASE**: One temp dir getter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/temp-dir (~2M+ downloads/week)
 *
 * Features:
 * - Get system temp directory
 * - Cross-platform compatible
 * - Simple API
 * - Zero dependencies
 */

const os = await import('node:os');

export const tempDir = os.tmpdir();

export default tempDir;

if (import.meta.url.includes("elide-temp-dir.ts")) {
  console.log("📂 temp-dir - Get System Temp Directory (POLYGLOT!)\n");

  console.log("=== Example 1: Get Temp Directory ===");
  console.log("System temp directory:", tempDir);
  console.log();

  console.log("=== Example 2: Use in Path ===");
  const path = await import('node:path');
  const myTempFile = path.join(tempDir, 'my-file.txt');
  console.log("Temp file path:", myTempFile);
  console.log();

  console.log("🚀 Performance: ~2M+ downloads/week on npm!");
}
