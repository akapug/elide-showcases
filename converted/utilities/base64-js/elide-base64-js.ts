/**
 * base64-js - Base64 Encoding/Decoding
 *
 * Pure JavaScript Base64 encoding and decoding.
 *
 * Package has ~120M+ downloads/week on npm!
 */

function toByteArray(base64: string): Uint8Array {
  const str = atob(base64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

function fromByteArray(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export default { toByteArray, fromByteArray };
export { toByteArray, fromByteArray };

if (import.meta.url.includes("elide-base64-js.ts")) {
  console.log("🔤 base64-js - Base64 Encoding/Decoding\n");
  const text = "Hello, World!";
  const bytes = new TextEncoder().encode(text);
  const b64 = fromByteArray(bytes);
  console.log("Original:", text);
  console.log("Base64:", b64);
  console.log("Decoded:", new TextDecoder().decode(toByteArray(b64)));
  console.log("\n🚀 ~120M+ downloads/week on npm");
}
