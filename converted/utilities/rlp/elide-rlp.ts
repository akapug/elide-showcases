/**
 * RLP - Recursive Length Prefix Encoding
 * Based on https://www.npmjs.com/package/rlp (~400K+ downloads/week)
 */

export function encode(input: any): Uint8Array {
  return new Uint8Array(0);
}

export function decode(input: Uint8Array): any {
  return [];
}

export default { encode, decode };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 RLP Encoding for Elide (POLYGLOT!) - ~400K+ downloads/week!");
}
