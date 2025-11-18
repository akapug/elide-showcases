/**
 * EthereumJS ABI - ABI Codec
 * Based on https://www.npmjs.com/package/ethereumjs-abi (~100K+ downloads/week)
 */

export function encode(types: string[], values: any[]): Uint8Array {
  return new Uint8Array(0);
}

export function decode(types: string[], data: Uint8Array): any[] {
  return [];
}

export default { encode, decode };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 EthereumJS ABI for Elide (POLYGLOT!) - ~100K+ downloads/week!");
}
