/**
 * base-64 - Base64 Encoding/Decoding
 *
 * Robust Base64 encoder/decoder that works with Unicode.
 *
 * Package has ~15M+ downloads/week on npm!
 */

function encode(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function decode(input: string): string {
  return decodeURIComponent(escape(atob(input)));
}

export default { encode, decode };
export { encode, decode };

if (import.meta.url.includes("elide-base-64.ts")) {
  console.log("🔤 base-64 - Unicode-Safe Base64\n");
  const text = "Hello, 世界!";
  const encoded = encode(text);
  console.log("Original:", text);
  console.log("Encoded:", encoded);
  console.log("Decoded:", decode(encoded));
  console.log("\n🚀 ~15M+ downloads/week on npm");
}
