/**
 * Is-Zip - Check if ZIP
 * 
 * Check if a Buffer/Uint8Array is a ZIP archive.
 * **POLYGLOT SHOWCASE**: One ZIP detector for ALL languages on Elide!
 * 
 * Package has ~5M downloads/week on npm!
 */

export default function isZip(buf: Uint8Array): boolean {
  if (!buf || buf.length < 4) return false;
  return buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07);
}

if (import.meta.url.includes("elide-is-zip.ts")) {
  console.log("🔍 Is-Zip - Check if ZIP (POLYGLOT!) - ~5M downloads/week\n");
}
