/**
 * Symbol Polyfill
 *
 * ES6 Symbol polyfill.
 * **POLYGLOT SHOWCASE**: Symbol for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/symbol-polyfill (~100K+ downloads/week)
 */

let symbolCounter = 0;

export class SymbolPolyfill {
  private _description: string;
  private _id: number;

  constructor(description = '') {
    this._description = description;
    this._id = symbolCounter++;
  }

  toString(): string {
    return `Symbol(${this._description})`;
  }

  valueOf(): symbol {
    return this as any;
  }

  static for(key: string): SymbolPolyfill {
    return new SymbolPolyfill(key);
  }

  static keyFor(sym: SymbolPolyfill): string | undefined {
    return sym._description;
  }
}

export default SymbolPolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔣 Symbol Polyfill (POLYGLOT!)\n");
  
  const sym1 = new SymbolPolyfill('test');
  const sym2 = new SymbolPolyfill('test');
  console.log('Symbol 1:', sym1.toString());
  console.log('Symbol 2:', sym2.toString());
  console.log('Are equal:', sym1 === sym2);
  console.log("\n  ✓ ~100K+ downloads/week!");
}
