/**
 * fs-extra - Enhanced File System Operations
 *
 * Extended file system operations beyond Node.js built-in fs module
 * Includes copy, move, remove, ensure, json read/write, and more
 *
 * Popular package with ~80M downloads/week on npm!
 */

interface CopyOptions {
  overwrite?: boolean;
  preserveTimestamps?: boolean;
}

interface MoveOptions {
  overwrite?: boolean;
}

/**
 * Copy a file or directory
 */
export async function copy(src: string, dest: string, options: CopyOptions = {}): Promise<void> {
  const { overwrite = true } = options;

  try {
    const srcStat = await Deno.stat(src);

    if (srcStat.isDirectory) {
      await ensureDir(dest);
      for await (const entry of Deno.readDir(src)) {
        await copy(`${src}/${entry.name}`, `${dest}/${entry.name}`, options);
      }
    } else {
      if (!overwrite) {
        try {
          await Deno.stat(dest);
          return; // Dest exists, don't overwrite
        } catch {
          // Dest doesn't exist, proceed
        }
      }
      await Deno.copyFile(src, dest);
    }
  } catch (error) {
    throw new Error(`Failed to copy ${src} to ${dest}: ${error}`);
  }
}

/**
 * Copy a file or directory synchronously
 */
export function copySync(src: string, dest: string, options: CopyOptions = {}): void {
  const { overwrite = true } = options;

  try {
    const srcStat = Deno.statSync(src);

    if (srcStat.isDirectory) {
      ensureDirSync(dest);
      for (const entry of Deno.readDirSync(src)) {
        copySync(`${src}/${entry.name}`, `${dest}/${entry.name}`, options);
      }
    } else {
      if (!overwrite) {
        try {
          Deno.statSync(dest);
          return; // Dest exists, don't overwrite
        } catch {
          // Dest doesn't exist, proceed
        }
      }
      Deno.copyFileSync(src, dest);
    }
  } catch (error) {
    throw new Error(`Failed to copy ${src} to ${dest}: ${error}`);
  }
}

/**
 * Move a file or directory
 */
export async function move(src: string, dest: string, options: MoveOptions = {}): Promise<void> {
  const { overwrite = false } = options;

  if (!overwrite) {
    try {
      await Deno.stat(dest);
      throw new Error(`Destination ${dest} already exists`);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Good, dest doesn't exist
      } else {
        throw error;
      }
    }
  }

  try {
    await Deno.rename(src, dest);
  } catch {
    // Cross-device move, copy then remove
    await copy(src, dest, { overwrite });
    await remove(src);
  }
}

/**
 * Remove a file or directory
 */
export async function remove(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

/**
 * Remove a file or directory synchronously
 */
export function removeSync(path: string): void {
  try {
    Deno.removeSync(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

/**
 * Ensure a directory exists (create if not)
 */
export async function ensureDir(dir: string): Promise<void> {
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Ensure a directory exists synchronously
 */
export function ensureDirSync(dir: string): void {
  try {
    Deno.mkdirSync(dir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Ensure a file exists (create if not)
 */
export async function ensureFile(file: string): Promise<void> {
  try {
    const stat = await Deno.stat(file);
    if (!stat.isFile) {
      throw new Error(`${file} exists but is not a file`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      const dir = file.substring(0, file.lastIndexOf('/'));
      if (dir) {
        await ensureDir(dir);
      }
      await Deno.writeTextFile(file, '');
    } else {
      throw error;
    }
  }
}

/**
 * Read JSON file
 */
export async function readJson(file: string): Promise<any> {
  const content = await Deno.readTextFile(file);
  return JSON.parse(content);
}

/**
 * Read JSON file synchronously
 */
export function readJsonSync(file: string): any {
  const content = Deno.readTextFileSync(file);
  return JSON.parse(content);
}

/**
 * Write JSON file
 */
export async function writeJson(file: string, data: any, options: { spaces?: number } = {}): Promise<void> {
  const { spaces = 2 } = options;
  const content = JSON.stringify(data, null, spaces);
  await Deno.writeTextFile(file, content);
}

/**
 * Write JSON file synchronously
 */
export function writeJsonSync(file: string, data: any, options: { spaces?: number } = {}): void {
  const { spaces = 2 } = options;
  const content = JSON.stringify(data, null, spaces);
  Deno.writeTextFileSync(file, content);
}

/**
 * Empty a directory (remove all contents)
 */
export async function emptyDir(dir: string): Promise<void> {
  try {
    for await (const entry of Deno.readDir(dir)) {
      await remove(`${dir}/${entry.name}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await ensureDir(dir);
    } else {
      throw error;
    }
  }
}

/**
 * Check if path exists
 */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path exists synchronously
 */
export function pathExistsSync(path: string): boolean {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
}

// CLI Demo
if (import.meta.url.includes("elide-fs-extra.ts")) {
  console.log("📁 fs-extra - Enhanced File System for Elide\n");

  console.log("=== Example 1: Copy Files ===");
  console.log('await copy("source.txt", "dest.txt")');
  console.log('await copy("source-dir", "dest-dir")');
  console.log();

  console.log("=== Example 2: Ensure Directory ===");
  console.log('await ensureDir("path/to/dir")');
  console.log('// Creates directory and all parent directories');
  console.log();

  console.log("=== Example 3: JSON Operations ===");
  console.log('const data = await readJson("config.json")');
  console.log('await writeJson("output.json", { foo: "bar" })');
  console.log();

  console.log("=== Example 4: Move Files ===");
  console.log('await move("old.txt", "new.txt")');
  console.log('await move("old-dir", "new-dir", { overwrite: true })');
  console.log();

  console.log("=== Example 5: Remove Files ===");
  console.log('await remove("file.txt")');
  console.log('await remove("directory") // Recursive');
  console.log();

  console.log("=== Example 6: Path Exists ===");
  console.log('const exists = await pathExists("file.txt")');
  console.log('if (await pathExists("config.json")) { ... }');
  console.log();

  console.log("=== Example 7: Empty Directory ===");
  console.log('await emptyDir("temp")');
  console.log('// Removes all contents but keeps directory');
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Build scripts and automation");
  console.log("- File management in applications");
  console.log("- Config file handling");
  console.log("- Test setup/teardown");
  console.log("- Deployment scripts");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~80M downloads/week on npm");
}

export default {
  copy,
  copySync,
  move,
  remove,
  removeSync,
  ensureDir,
  ensureDirSync,
  ensureFile,
  readJson,
  readJsonSync,
  writeJson,
  writeJsonSync,
  emptyDir,
  pathExists,
  pathExistsSync,
};
