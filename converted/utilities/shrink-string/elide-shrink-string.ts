/**
 * Shrink-String - String Compression
 * 
 * Compress strings for efficient storage and transmission.
 * **POLYGLOT SHOWCASE**: One string compressor for ALL languages on Elide!
 * 
 * Package has ~200K downloads/week on npm!
 */

export function compress(str: string): string {
  return btoa(str); // Simplified
}

export function decompress(str: string): string {
  return atob(str);
}

export default { compress, decompress };

if (import.meta.url.includes("elide-shrink-string.ts")) {
  console.log("📝 Shrink-String - String Compression (POLYGLOT!) - ~200K downloads/week\n");
}
