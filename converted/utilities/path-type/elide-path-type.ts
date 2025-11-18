/**
 * path-type - Check Path Type (File or Directory)
 *
 * Check whether a path is a file or directory.
 * **POLYGLOT SHOWCASE**: One path type checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/path-type (~2M+ downloads/week)
 *
 * Features:
 * - Check if path is file or directory
 * - Async and sync APIs
 * - Check for symlinks
 * - Cross-platform compatible
 * - Zero dependencies
 */

const fs = await import('node:fs');
const fsPromises = await import('node:fs/promises');

export async function isFile(path: string): Promise<boolean> {
  try {
    const stats = await fsPromises.stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

export function isFileSync(path: string): boolean {
  try {
    return fs.statSync(path).isFile();
  } catch {
    return false;
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await fsPromises.stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export function isDirectorySync(path: string): boolean {
  try {
    return fs.statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export async function isSymlink(path: string): Promise<boolean> {
  try {
    const stats = await fsPromises.lstat(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

export function isSymlinkSync(path: string): boolean {
  try {
    return fs.lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

export default {
  isFile,
  isFileSync,
  isDirectory,
  isDirectorySync,
  isSymlink,
  isSymlinkSync,
};

if (import.meta.url.includes("elide-path-type.ts")) {
  console.log("🔍 path-type - Check Path Type (POLYGLOT!)\n");

  console.log("=== Example 1: Check File ===");
  const thisFile = import.meta.url.replace('file://', '');
  console.log("This file is a file:", await isFile(thisFile));
  console.log("This file is a directory:", await isDirectory(thisFile));
  console.log();

  console.log("=== Example 2: Check Directory ===");
  console.log("/tmp is a file:", await isFile('/tmp'));
  console.log("/tmp is a directory:", await isDirectory('/tmp'));
  console.log();

  console.log("=== Example 3: Sync API ===");
  console.log("/tmp is directory (sync):", isDirectorySync('/tmp'));
  console.log();

  console.log("🚀 Performance: ~2M+ downloads/week on npm!");
}
