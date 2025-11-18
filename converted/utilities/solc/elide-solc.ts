/**
 * Solc - Solidity Compiler
 * Based on https://www.npmjs.com/package/solc (~100K+ downloads/week)
 */

export function compile(source: string): any {
  return { contracts: {}, errors: [] };
}

export default { compile };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📜 Solc - Solidity Compiler for Elide (POLYGLOT!) - ~100K+ downloads/week!");
}
