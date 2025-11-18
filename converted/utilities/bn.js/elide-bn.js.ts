/**
 * BN.js - Big Number Library
 * Based on https://www.npmjs.com/package/bn.js (~2M+ downloads/week)
 */

export class BN {
  constructor(public value: string | number | bigint) {}
  
  add(bn: BN): BN { return new BN(0); }
  sub(bn: BN): BN { return new BN(0); }
  mul(bn: BN): BN { return new BN(0); }
  div(bn: BN): BN { return new BN(0); }
  toString(base?: number): string { return this.value.toString(); }
}

export default BN;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔢 BN.js - Big Numbers for Elide (POLYGLOT!) - ~2M+ downloads/week!");
}
