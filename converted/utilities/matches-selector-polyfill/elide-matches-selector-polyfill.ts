/**
 * Matches Selector Polyfill
 *
 * Polyfill for Element.matches API.
 * **POLYGLOT SHOWCASE**: matches selector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/matches-selector-polyfill (~30K+ downloads/week)
 */

export function matchesSelector(element: Element, selector: string): boolean {
  // Try native matches
  if (element.matches) {
    return element.matches(selector);
  }
  
  // Try vendor prefixes
  const vendorMatches = 
    (element as any).webkitMatchesSelector ||
    (element as any).mozMatchesSelector ||
    (element as any).msMatchesSelector ||
    (element as any).oMatchesSelector;
  
  if (vendorMatches) {
    return vendorMatches.call(element, selector);
  }
  
  // Fallback implementation
  const matches = (element.ownerDocument || document).querySelectorAll(selector);
  let i = matches.length;
  while (--i >= 0 && matches.item(i) !== element) {}
  return i > -1;
}

// Polyfill Element.prototype.matches
if (typeof Element !== 'undefined' && !Element.prototype.matches) {
  Element.prototype.matches = function(this: Element, selector: string): boolean {
    return matchesSelector(this, selector);
  };
}

export default matchesSelector;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Matches Selector Polyfill (POLYGLOT!)\n");
  
  console.log('matches selector polyfill loaded');
  console.log('Check if element matches CSS selector');
  console.log();
  console.log('Example usage:');
  console.log('  if (element.matches(".active")) { ... }');
  console.log('  if (element.matches("#my-id")) { ... }');
  console.log("\n  ✓ ~30K+ downloads/week!");
}
