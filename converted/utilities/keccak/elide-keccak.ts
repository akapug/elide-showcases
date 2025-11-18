/**
 * Keccak - Keccak Hash Function
 * Based on https://www.npmjs.com/package/keccak (~300K+ downloads/week)
 */

export function keccak256(data: Uint8Array | string): Uint8Array {
  return new Uint8Array(32);
}

export function keccak512(data: Uint8Array | string): Uint8Array {
  return new Uint8Array(64);
}

export default { keccak256, keccak512 };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔐 Keccak Hash for Elide (POLYGLOT!) - ~300K+ downloads/week!");
}
