/**
 * base32 - Base32 Encoding/Decoding
 *
 * Base32 encoding/decoding (RFC 4648).
 *
 * Package has ~2M+ downloads/week on npm!
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function decode(input: string): Uint8Array {
  const cleanInput = input.toUpperCase().replace(/=+$/, '');
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = ALPHABET.indexOf(cleanInput[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

export default { encode, decode };
export { encode, decode };

if (import.meta.url.includes("elide-base32.ts")) {
  console.log("🔤 base32 - Base32 Encoding/Decoding\n");
  const text = "Hello!";
  const encoded = encode(text);
  const decoded = new TextDecoder().decode(decode(encoded));
  console.log("Original:", text);
  console.log("Base32:", encoded);
  console.log("Decoded:", decoded);
  console.log("\n🚀 ~2M+ downloads/week on npm");
}
