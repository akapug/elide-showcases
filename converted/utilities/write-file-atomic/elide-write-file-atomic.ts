/**
 * write-file-atomic - Atomic File Writing
 *
 * Write files atomically to prevent corruption
 * Writes to temp file then renames for safety
 *
 * Popular package with ~80M downloads/week on npm!
 */

interface WriteFileAtomicOptions {
  encoding?: string;
  mode?: number;
  chown?: { uid: number; gid: number };
}

export async function writeFileAtomic(
  filename: string,
  data: string | Uint8Array,
  options: WriteFileAtomicOptions = {}
): Promise<void> {
  const tmpFile = `${filename}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;

  try {
    // Write to temporary file
    if (typeof data === 'string') {
      await Deno.writeTextFile(tmpFile, data);
    } else {
      await Deno.writeFile(tmpFile, data);
    }

    // Set permissions if specified
    if (options.mode !== undefined) {
      await Deno.chmod(tmpFile, options.mode);
    }

    // Atomically rename temp file to target
    await Deno.rename(tmpFile, filename);
  } catch (error) {
    // Clean up temp file on error
    try {
      await Deno.remove(tmpFile);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

export function writeFileAtomicSync(
  filename: string,
  data: string | Uint8Array,
  options: WriteFileAtomicOptions = {}
): void {
  const tmpFile = `${filename}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;

  try {
    if (typeof data === 'string') {
      Deno.writeTextFileSync(tmpFile, data);
    } else {
      Deno.writeFileSync(tmpFile, data);
    }

    if (options.mode !== undefined) {
      Deno.chmodSync(tmpFile, options.mode);
    }

    Deno.renameSync(tmpFile, filename);
  } catch (error) {
    try {
      Deno.removeSync(tmpFile);
    } catch {
      // Ignore
    }
    throw error;
  }
}

// CLI Demo
if (import.meta.url.includes("elide-write-file-atomic.ts")) {
  console.log("⚛️  write-file-atomic - Atomic File Writing for Elide\n");
  console.log('await writeFileAtomic("config.json", JSON.stringify(data, null, 2));');
  console.log('// Prevents corruption if interrupted');
  console.log();
  console.log('writeFileAtomicSync("important.txt", "critical data");');
  console.log();
  console.log("✅ Use Cases: Config files, databases, critical data");
  console.log("🚀 ~80M downloads/week on npm");
}

export default writeFileAtomic;
export { writeFileAtomic, writeFileAtomicSync };
