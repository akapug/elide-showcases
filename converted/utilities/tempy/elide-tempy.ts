/**
 * tempy - Get Random Temporary File or Directory Paths
 *
 * Generate random temporary file and directory paths.
 * **POLYGLOT SHOWCASE**: One temp path generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/tempy (~500K+ downloads/week)
 *
 * Features:
 * - Generate temp file paths
 * - Generate temp directory paths
 * - Custom extensions
 * - Custom names
 * - Zero dependencies
 */

const path = await import('node:path');
const os = await import('node:os');
const crypto = await import('node:crypto');
const fsPromises = await import('node:fs/promises');

function randomId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export interface TempyOptions {
  extension?: string;
  name?: string;
}

export function file(options: TempyOptions = {}): string {
  const { extension = '' } = options;
  const filename = randomId() + (extension ? `.${extension.replace(/^\./, '')}` : '');
  return path.join(os.tmpdir(), filename);
}

export function directory(options: { prefix?: string } = {}): string {
  const { prefix = '' } = options;
  const dirname = prefix + randomId();
  return path.join(os.tmpdir(), dirname);
}

export async function write(data: string | Buffer, options: TempyOptions = {}): Promise<string> {
  const filePath = file(options);
  await fsPromises.writeFile(filePath, data);
  return filePath;
}

export function root(): string {
  return os.tmpdir();
}

export default { file, directory, write, root };

if (import.meta.url.includes("elide-tempy.ts")) {
  console.log("🎲 tempy - Random Temp Paths (POLYGLOT!)\n");

  console.log("=== Example 1: Generate Temp File Path ===");
  console.log("Temp file:", file());
  console.log("With extension:", file({ extension: '.json' }));
  console.log("With extension (dot):", file({ extension: 'txt' }));
  console.log();

  console.log("=== Example 2: Generate Temp Directory Path ===");
  console.log("Temp dir:", directory());
  console.log("With prefix:", directory({ prefix: 'cache-' }));
  console.log();

  console.log("=== Example 3: Write to Temp File ===");
  const tempFile = await write('Hello, World!', { extension: 'txt' });
  console.log("Written to:", tempFile);
  console.log();

  console.log("=== Example 4: Get Temp Root ===");
  console.log("Temp root:", root());
  console.log();

  console.log("🚀 Performance: ~500K+ downloads/week on npm!");
}
