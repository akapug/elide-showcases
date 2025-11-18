/**
 * temp - Temporary Files and Directories
 *
 * Create and manage temporary files and directories.
 * **POLYGLOT SHOWCASE**: One temp file manager for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/temp (~500K+ downloads/week)
 *
 * Features:
 * - Create temporary files
 * - Create temporary directories
 * - Auto cleanup on exit
 * - Custom prefix/suffix
 * - Zero dependencies (simplified)
 */

const fs = await import('node:fs');
const fsPromises = await import('node:fs/promises');
const path = await import('node:path');
const os = await import('node:os');

const createdPaths: string[] = [];

export interface TempOptions {
  prefix?: string;
  suffix?: string;
  dir?: string;
}

function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function mkdir(options: TempOptions = {}): Promise<string> {
  const { prefix = 'tmp-', suffix = '', dir = os.tmpdir() } = options;

  const tempName = `${prefix}${randomString()}${suffix}`;
  const tempPath = path.join(dir, tempName);

  await fsPromises.mkdir(tempPath, { recursive: true });
  createdPaths.push(tempPath);

  return tempPath;
}

export async function open(options: TempOptions = {}): Promise<{ path: string; fd: number }> {
  const { prefix = 'tmp-', suffix = '', dir = os.tmpdir() } = options;

  const tempName = `${prefix}${randomString()}${suffix}`;
  const tempPath = path.join(dir, tempName);

  const fd = await fsPromises.open(tempPath, 'w+');
  createdPaths.push(tempPath);

  return { path: tempPath, fd: fd.fd };
}

export function path(options: TempOptions = {}): string {
  const { prefix = 'tmp-', suffix = '', dir = os.tmpdir() } = options;
  const tempName = `${prefix}${randomString()}${suffix}`;
  return path.join(dir, tempName);
}

export async function cleanup(): Promise<void> {
  for (const p of createdPaths) {
    try {
      const stats = await fsPromises.stat(p);
      if (stats.isDirectory()) {
        await fsPromises.rm(p, { recursive: true, force: true });
      } else {
        await fsPromises.unlink(p);
      }
    } catch {
      // Ignore errors during cleanup
    }
  }
  createdPaths.length = 0;
}

// Auto cleanup on exit
process.on('exit', () => {
  for (const p of createdPaths) {
    try {
      const stats = fs.statSync(p);
      if (stats.isDirectory()) {
        fs.rmSync(p, { recursive: true, force: true });
      } else {
        fs.unlinkSync(p);
      }
    } catch {
      // Ignore
    }
  }
});

export default { mkdir, open, path, cleanup };

if (import.meta.url.includes("elide-temp.ts")) {
  console.log("🗂️ temp - Temporary Files and Directories (POLYGLOT!)\n");

  console.log("=== Example 1: Create Temp Directory ===");
  const tempDir = await mkdir({ prefix: 'my-app-' });
  console.log("Created temp directory:", tempDir);
  console.log();

  console.log("=== Example 2: Create Temp File ===");
  const tempFile = await open({ prefix: 'upload-', suffix: '.json' });
  console.log("Created temp file:", tempFile.path);
  console.log();

  console.log("=== Example 3: Get Temp Path ===");
  const tempPath = path({ prefix: 'cache-', suffix: '.tmp' });
  console.log("Generated temp path:", tempPath);
  console.log();

  console.log("=== Example 4: Cleanup ===");
  console.log("Cleaning up...");
  await cleanup();
  console.log("All temp files cleaned up!");
  console.log();

  console.log("🚀 Performance: ~500K+ downloads/week on npm!");
}
