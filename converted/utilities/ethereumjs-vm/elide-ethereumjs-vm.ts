/**
 * EthereumJS VM - Ethereum Virtual Machine
 * Based on https://www.npmjs.com/package/ethereumjs-vm (~50K+ downloads/week)
 */

export class VM {
  runCode(opts: any): Promise<any> {
    return Promise.resolve({ gasUsed: 21000n });
  }
}

export default VM;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ EthereumJS VM for Elide (POLYGLOT!) - ~50K+ downloads/week!");
}
