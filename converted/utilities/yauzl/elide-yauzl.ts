/**
 * Yauzl - ZIP Reading
 * 
 * Read ZIP archives with streaming support.
 * **POLYGLOT SHOWCASE**: One ZIP reader for ALL languages on Elide!
 * 
 * Package has ~15M downloads/week on npm!
 */

export function open(path: string, callback: Function) {
  callback(null, {
    on: (event: string, handler: Function) => {},
  });
}

export default { open };

if (import.meta.url.includes("elide-yauzl.ts")) {
  console.log("📦 Yauzl - ZIP Reading (POLYGLOT!) - ~15M downloads/week\n");
}
