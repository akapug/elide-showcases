/**
 * String.prototype.matchAll Polyfill
 *
 * ES2020 String.matchAll polyfill.
 * **POLYGLOT SHOWCASE**: String.matchAll for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/string.prototype.matchall (~300K+ downloads/week)
 */

export function* stringMatchAll(str: string, regexp: RegExp): IterableIterator<RegExpMatchArray> {
  const flags = regexp.flags;
  const re = new RegExp(regexp, flags.includes('g') ? flags : flags + 'g');
  let match;
  
  while ((match = re.exec(str)) !== null) {
    yield match;
  }
}

if (!String.prototype.matchAll) {
  String.prototype.matchAll = function(this: string, regexp: RegExp): IterableIterator<RegExpMatchArray> {
    return stringMatchAll(this, regexp);
  };
}

export default stringMatchAll;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔎 String.matchAll Polyfill (POLYGLOT!)\n");
  
  const str = 'test1 test2 test3';
  const matches = Array.from(stringMatchAll(str, /test\d/g));
  console.log('Matches:', matches.map(m => m[0]));
  console.log("\n  ✓ ~300K+ downloads/week!");
}
