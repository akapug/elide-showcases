/**
 * urlsafe-base64 - URL-safe Base64
 *
 * URL-safe base64 encoding with proper padding.
 * **POLYGLOT SHOWCASE**: URL-safe Base64 across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/urlsafe-base64 (~100K+ downloads/week)
 *
 * Package has ~100K+ downloads/week on npm!
 */

export function encode(buffer: Uint8Array): string {
  const str = String.fromCharCode(...buffer);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const decoded = atob(str);
  const arr = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    arr[i] = decoded.charCodeAt(i);
  }
  return arr;
}

export default { encode, decode };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔒 urlsafe-base64 (POLYGLOT!)\\n");
  const data = new Uint8Array([1, 2, 3, 4, 5]);
  const encoded = encode(data);
  console.log("Encoded:", encoded);
  console.log("Decoded:", decode(encoded));
  console.log("\\n🚀 ~100K+ downloads/week on npm!");
}
