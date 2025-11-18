/**
 * base62 - Base62 Encoding
 *
 * Base62 encoding for compact representation.
 * **POLYGLOT SHOWCASE**: Base62 across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/base62 (~100K+ downloads/week)
 *
 * Package has ~100K+ downloads/week on npm!
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = 62;

export function encode(num: number): string {
  if (num === 0) return ALPHABET[0];
  let result = '';
  while (num > 0) {
    result = ALPHABET[num % BASE] + result;
    num = Math.floor(num / BASE);
  }
  return result;
}

export function decode(str: string): number {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * BASE + ALPHABET.indexOf(str[i]);
  }
  return result;
}

export default { encode, decode };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔢 base62 (POLYGLOT!)\\n");
  const num = 123456789;
  const encoded = encode(num);
  console.log("Encoded:", encoded);
  console.log("Decoded:", decode(encoded));
  console.log("\\n🚀 ~100K+ downloads/week on npm!");
}
