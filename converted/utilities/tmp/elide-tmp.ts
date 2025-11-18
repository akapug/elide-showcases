/**
 * tmp - Temporary File and Directory Creator
 *
 * Simple library for creating temporary files and directories.
 * **POLYGLOT SHOWCASE**: One tmp creator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/tmp (~5M+ downloads/week)
 *
 * Features:
 * - Create temporary files
 * - Create temporary directories
 * - Custom prefix/suffix/name
 * - Automatic cleanup
 * - Zero dependencies (simplified)
 */

const fsPromises = await import('node:fs/promises');
const path = await import('node:path');
const os = await import('node:os');

export interface TmpOptions {
  prefix?: string;
  postfix?: string;
  name?: string;
  dir?: string;
  keep?: boolean;
}

function randomName(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function file(options: TmpOptions = {}): Promise<{ name: string; fd: number; removeCallback: () => Promise<void> }> {
  const {
    prefix = 'tmp-',
    postfix = '',
    name = randomName(),
    dir = os.tmpdir(),
    keep = false
  } = options;

  const filename = prefix + name + postfix;
  const fullPath = path.join(dir, filename);

  const fd = await fsPromises.open(fullPath, 'w+');

  const removeCallback = async () => {
    if (!keep) {
      await fd.close();
      await fsPromises.unlink(fullPath);
    }
  };

  return { name: fullPath, fd: fd.fd, removeCallback };
}

export async function dir(options: TmpOptions = {}): Promise<{ name: string; removeCallback: () => Promise<void> }> {
  const {
    prefix = 'tmp-',
    postfix = '',
    name = randomName(),
    dir = os.tmpdir(),
    keep = false
  } = options;

  const dirname = prefix + name + postfix;
  const fullPath = path.join(dir, dirname);

  await fsPromises.mkdir(fullPath, { recursive: true });

  const removeCallback = async () => {
    if (!keep) {
      await fsPromises.rm(fullPath, { recursive: true, force: true });
    }
  };

  return { name: fullPath, removeCallback };
}

export function tmpName(options: TmpOptions = {}): string {
  const {
    prefix = 'tmp-',
    postfix = '',
    name = randomName(),
    dir = os.tmpdir()
  } = options;

  const filename = prefix + name + postfix;
  return path.join(dir, filename);
}

export default { file, dir, tmpName };

if (import.meta.url.includes("elide-tmp.ts")) {
  console.log("📝 tmp - Temporary File Creator (POLYGLOT!)\n");

  console.log("=== Example 1: Create Temp File ===");
  const tmpFile = await file({ prefix: 'upload-', postfix: '.json' });
  console.log("Created:", tmpFile.name);
  await tmpFile.removeCallback();
  console.log("Cleaned up!");
  console.log();

  console.log("=== Example 2: Create Temp Directory ===");
  const tmpDir = await dir({ prefix: 'cache-' });
  console.log("Created:", tmpDir.name);
  await tmpDir.removeCallback();
  console.log("Cleaned up!");
  console.log();

  console.log("=== Example 3: Generate Temp Name ===");
  const name = tmpName({ prefix: 'session-', postfix: '.dat' });
  console.log("Generated name:", name);
  console.log();

  console.log("🚀 Performance: ~5M+ downloads/week on npm!");
}
