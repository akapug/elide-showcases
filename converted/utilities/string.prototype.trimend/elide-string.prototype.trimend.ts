/**
 * String.prototype.trimEnd Polyfill
 *
 * ES2019 String.trimEnd polyfill.
 * **POLYGLOT SHOWCASE**: String.trimEnd for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/string.prototype.trimend (~500K+ downloads/week)
 */

export function stringTrimEnd(str: string): string {
  return str.replace(/\s+$/, '');
}

if (!String.prototype.trimEnd) {
  String.prototype.trimEnd = function(this: string): string {
    return stringTrimEnd(this);
  };
}

if (!String.prototype.trimRight) {
  String.prototype.trimRight = String.prototype.trimEnd;
}

export default stringTrimEnd;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✂️ String.trimEnd Polyfill (POLYGLOT!)\n");
  
  const str = '   hello world   ';
  console.log('Original:', `|${str}|`);
  console.log('TrimEnd:', `|${stringTrimEnd(str)}|`);
  console.log("\n  ✓ ~500K+ downloads/week!");
}
