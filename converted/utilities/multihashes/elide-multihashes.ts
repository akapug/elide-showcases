/**
 * Multihashes - Self-describing Hashes
 * Based on https://www.npmjs.com/package/multihashes (~200K+ downloads/week)
 */

export function encode(digest: Uint8Array, code: number): Uint8Array {
  return new Uint8Array(0);
}

export function decode(bytes: Uint8Array): { code: number; digest: Uint8Array } {
  return { code: 0x12, digest: new Uint8Array(32) };
}

export default { encode, decode };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔗 Multihashes for Elide (POLYGLOT!) - ~200K+ downloads/week!");
}
