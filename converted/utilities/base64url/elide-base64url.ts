/**
 * base64url - URL-safe Base64
 *
 * URL-safe base64 encoding/decoding.
 * **POLYGLOT SHOWCASE**: URL-safe Base64 across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/base64url (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function encode(input: string | Uint8Array): string {
  const str = typeof input === 'string' ? input : new TextDecoder().decode(input);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

export function toBuffer(input: string): Uint8Array {
  const str = decode(input);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

export default { encode, decode, toBuffer };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔗 base64url - URL-safe Base64 (POLYGLOT!)\\n");
  const encoded = encode("Hello, World!");
  console.log("Encoded:", encoded);
  console.log("Decoded:", decode(encoded));
  console.log("\\n🚀 ~500K+ downloads/week on npm!");
}
