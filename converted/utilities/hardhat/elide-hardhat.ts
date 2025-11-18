/**
 * Hardhat - Ethereum Development Environment
 * Based on https://www.npmjs.com/package/hardhat (~300K+ downloads/week)
 */

export class Hardhat {
  compile(): void { console.log('Compiling with Hardhat...'); }
  test(): void { console.log('Running Hardhat tests...'); }
  node(): void { console.log('Starting Hardhat Network...'); }
}

export default Hardhat;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⛏️  Hardhat for Elide (POLYGLOT!) - ~300K+ downloads/week!");
}
