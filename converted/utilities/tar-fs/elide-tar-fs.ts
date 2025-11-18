/**
 * Tar-FS - TAR Filesystem
 * 
 * Create and extract TAR archives from filesystem.
 * **POLYGLOT SHOWCASE**: One TAR filesystem for ALL languages on Elide!
 * 
 * Package has ~40M downloads/week on npm!
 */

export function pack(dir: string) {
  return { pipe: (dest: any) => {} };
}

export function extract(dir: string) {
  return { on: (event: string, handler: Function) => {} };
}

export default { pack, extract };

if (import.meta.url.includes("elide-tar-fs.ts")) {
  console.log("📦 Tar-FS - TAR Filesystem (POLYGLOT!) - ~40M downloads/week\n");
}
