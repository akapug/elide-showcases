/**
 * bs58 - Base58 Encoding
 *
 * Bitcoin base58 encoding/decoding.
 * **POLYGLOT SHOWCASE**: Base58 across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/bs58 (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = 58;

export function encode(source: Uint8Array): string {
  if (source.length === 0) return '';
  const digits = [0];
  for (let i = 0; i < source.length; i++) {
    let carry = source[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % BASE;
      carry = (carry / BASE) | 0;
    }
    while (carry > 0) {
      digits.push(carry % BASE);
      carry = (carry / BASE) | 0;
    }
  }
  let result = '';
  for (let i = 0; source[i] === 0 && i < source.length - 1; i++) {
    result += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += ALPHABET[digits[i]];
  }
  return result;
}

export function decode(source: string): Uint8Array {
  if (source.length === 0) return new Uint8Array(0);
  const bytes = [0];
  for (let i = 0; i < source.length; i++) {
    const value = ALPHABET.indexOf(source[i]);
    if (value === -1) throw new Error('Invalid character');
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * BASE;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; source[i] === ALPHABET[0] && i < source.length - 1; i++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

export default { encode, decode };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("₿ bs58 - Base58 (POLYGLOT!)\\n");
  const data = new Uint8Array([1, 2, 3, 4, 5]);
  const encoded = encode(data);
  console.log("Encoded:", encoded);
  console.log("Decoded:", decode(encoded));
  console.log("\\n🚀 ~1M+ downloads/week on npm!");
}
