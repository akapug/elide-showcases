/**
 * DOM Matches - Element Selector Matching
 *
 * Polyfill for Element.matches() method.
 * **POLYGLOT SHOWCASE**: One matches() helper for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dom-matches (~15M downloads/week)
 *
 * Features:
 * - Element.matches() polyfill
 * - CSS selector matching
 * - Cross-browser support
 * - Vendor prefix handling
 * - Lightweight
 * - Standards-compliant
 *
 * Polyglot Benefits:
 * - Selector matching in any language
 * - ONE API for all services
 * - Share matching logic
 * - Consistent behavior
 *
 * Use cases:
 * - Element matching
 * - Event delegation
 * - Conditional logic
 * - Selector validation
 *
 * Package has ~15M downloads/week on npm!
 */

function matches(element: Element, selector: string): boolean {
  // Use native matches if available
  if (element.matches) {
    return element.matches(selector);
  }

  // Try vendor-prefixed versions
  const matchesMethod =
    (element as any).webkitMatchesSelector ||
    (element as any).mozMatchesSelector ||
    (element as any).msMatchesSelector ||
    (element as any).oMatchesSelector;

  if (matchesMethod) {
    return matchesMethod.call(element, selector);
  }

  // Fallback: check if element is in querySelectorAll results
  const parent = element.parentElement || element.ownerDocument;
  if (!parent) return false;

  const matches = parent.querySelectorAll(selector);
  return Array.from(matches).includes(element);
}

function matchesAny(element: Element, selectors: string[]): boolean {
  return selectors.some(selector => matches(element, selector));
}

function matchesAll(element: Element, selectors: string[]): boolean {
  return selectors.every(selector => matches(element, selector));
}

function filter(elements: Element[], selector: string): Element[] {
  return elements.filter(el => matches(el, selector));
}

function reject(elements: Element[], selector: string): Element[] {
  return elements.filter(el => !matches(el, selector));
}

function some(elements: Element[], selector: string): boolean {
  return elements.some(el => matches(el, selector));
}

function every(elements: Element[], selector: string): boolean {
  return elements.every(el => matches(el, selector));
}

export default matches;
export { matches, matchesAny, matchesAll, filter, reject, some, every };

// CLI Demo
if (import.meta.url.includes("elide-dom-matches.ts")) {
  console.log("✅ DOM Matches - Selector Matching (POLYGLOT!)\n");

  console.log("Example matches operations:");
  console.log("  matches(element, '.active')");
  console.log("  matches(element, 'div.item')");
  console.log("  matchesAny(el, ['.a', '.b'])");
  console.log("  filter(elements, '.visible')");

  console.log("\n🚀 ~15M downloads/week on npm!");
  console.log("💡 Essential for selector matching!");
}
