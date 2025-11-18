/**
 * Element.closest Polyfill
 *
 * Polyfill for Element.closest API.
 * **POLYGLOT SHOWCASE**: Element.closest for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/element-closest (~100K+ downloads/week)
 */

export function elementClosest(element: Element, selector: string): Element | null {
  let el: Element | null = element;
  
  while (el) {
    if (matches(el, selector)) {
      return el;
    }
    el = el.parentElement;
  }
  
  return null;
}

function matches(element: Element, selector: string): boolean {
  const matches = 
    element.matches ||
    (element as any).matchesSelector ||
    (element as any).webkitMatchesSelector ||
    (element as any).mozMatchesSelector ||
    (element as any).msMatchesSelector ||
    (element as any).oMatchesSelector;
  
  return matches ? matches.call(element, selector) : false;
}

// Polyfill Element.prototype.closest
if (typeof Element !== 'undefined' && !Element.prototype.closest) {
  Element.prototype.closest = function(this: Element, selector: string): Element | null {
    return elementClosest(this, selector);
  };
}

export default elementClosest;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Element.closest Polyfill (POLYGLOT!)\n");
  
  console.log('Element.closest polyfill loaded');
  console.log('Find closest ancestor matching selector');
  console.log();
  console.log('Example usage:');
  console.log('  const parent = element.closest(".parent-class")');
  console.log("\n  ✓ ~100K+ downloads/week!");
}
