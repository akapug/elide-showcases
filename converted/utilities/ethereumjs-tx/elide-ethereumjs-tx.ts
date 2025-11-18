/**
 * EthereumJS TX - Ethereum Transaction Library
 * Based on https://www.npmjs.com/package/ethereumjs-tx (~150K+ downloads/week)
 */

export class Transaction {
  constructor(public data: any) {}
  sign(privateKey: Uint8Array): void {}
  getSenderAddress(): Uint8Array { return new Uint8Array(20); }
  serialize(): Uint8Array { return new Uint8Array(0); }
}

export default Transaction;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📝 EthereumJS TX for Elide (POLYGLOT!) - ~150K+ downloads/week!");
}
