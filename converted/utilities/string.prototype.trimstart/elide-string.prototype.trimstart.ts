/**
 * String.prototype.trimStart Polyfill
 *
 * ES2019 String.trimStart polyfill.
 * **POLYGLOT SHOWCASE**: String.trimStart for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/string.prototype.trimstart (~500K+ downloads/week)
 */

export function stringTrimStart(str: string): string {
  return str.replace(/^\s+/, '');
}

if (!String.prototype.trimStart) {
  String.prototype.trimStart = function(this: string): string {
    return stringTrimStart(this);
  };
}

if (!String.prototype.trimLeft) {
  String.prototype.trimLeft = String.prototype.trimStart;
}

export default stringTrimStart;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✂️ String.trimStart Polyfill (POLYGLOT!)\n");
  
  const str = '   hello world   ';
  console.log('Original:', `|${str}|`);
  console.log('TrimStart:', `|${stringTrimStart(str)}|`);
  console.log("\n  ✓ ~500K+ downloads/week!");
}
