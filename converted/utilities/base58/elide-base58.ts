/**
 * base58 - Base58 Encoding/Decoding
 *
 * Base58 encoding (Bitcoin-style).
 *
 * Package has ~8M+ downloads/week on npm!
 */

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encode(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;

  let num = 0n;
  for (const byte of bytes) {
    num = num * 256n + BigInt(byte);
  }

  let encoded = '';
  while (num > 0n) {
    encoded = ALPHABET[Number(num % 58n)] + encoded;
    num = num / 58n;
  }

  // Leading zeros
  for (const byte of bytes) {
    if (byte !== 0) break;
    encoded = ALPHABET[0] + encoded;
  }

  return encoded || ALPHABET[0];
}

function decode(input: string): Uint8Array {
  let num = 0n;
  for (const char of input) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid Base58 character');
    num = num * 58n + BigInt(idx);
  }

  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }

  // Leading zeros
  for (const char of input) {
    if (char !== ALPHABET[0]) break;
    bytes.unshift(0);
  }

  return new Uint8Array(bytes);
}

export default { encode, decode };
export { encode, decode };

if (import.meta.url.includes("elide-base58.ts")) {
  console.log("🔤 base58 - Base58 Encoding (Bitcoin-style)\n");
  const text = "Hello!";
  const encoded = encode(text);
  const decoded = new TextDecoder().decode(decode(encoded));
  console.log("Original:", text);
  console.log("Base58:", encoded);
  console.log("Decoded:", decoded);
  console.log("\n🚀 ~8M+ downloads/week on npm");
}
