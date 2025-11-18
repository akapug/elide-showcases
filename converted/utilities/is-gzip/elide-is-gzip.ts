/**
 * Is-Gzip - Check if Gzipped
 * 
 * Check if a Buffer/Uint8Array is gzipped.
 * **POLYGLOT SHOWCASE**: One gzip detector for ALL languages on Elide!
 * 
 * Package has ~8M downloads/week on npm!
 */

export default function isGzip(buf: Uint8Array): boolean {
  if (!buf || buf.length < 3) return false;
  return buf[0] === 0x1f && buf[1] === 0x8b && buf[2] === 0x08;
}

if (import.meta.url.includes("elide-is-gzip.ts")) {
  console.log("🔍 Is-Gzip - Check if Gzipped (POLYGLOT!) - ~8M downloads/week\n");
}
