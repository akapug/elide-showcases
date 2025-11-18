/**
 * hi-base32 - Base32 Encoding
 *
 * Fast base32 encoding and decoding.
 * **POLYGLOT SHOWCASE**: Base32 across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hi-base32 (~200K+ downloads/week)
 *
 * Package has ~200K+ downloads/week on npm!
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encode(data: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;
    
    while (bits >= 5) {
      result += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += ALPHABET[(value << (5 - bits)) & 31];
  }
  
  return result;
}

export function decode(str: string): Uint8Array {
  str = str.toUpperCase().replace(/=+$/, '');
  const result: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < str.length; i++) {
    value = (value << 5) | ALPHABET.indexOf(str[i]);
    bits += 5;
    
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return new Uint8Array(result);
}

export default { encode, decode };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔢 hi-base32 (POLYGLOT!)\\n");
  const data = new TextEncoder().encode("Hello");
  const encoded = encode(data);
  console.log("Encoded:", encoded);
  console.log("Decoded:", new TextDecoder().decode(decode(encoded)));
  console.log("\\n🚀 ~200K+ downloads/week on npm!");
}
