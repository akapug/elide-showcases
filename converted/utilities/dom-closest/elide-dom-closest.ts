/**
 * DOM Closest - Find Closest Matching Element
 *
 * Polyfill and utility for Element.closest() method.
 * **POLYGLOT SHOWCASE**: One closest() helper for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dom-closest (~15M downloads/week)
 *
 * Features:
 * - Element.closest() polyfill
 * - Traverse up the DOM tree
 * - CSS selector matching
 * - Cross-browser support
 * - Lightweight
 * - Standards-compliant
 *
 * Polyglot Benefits:
 * - DOM traversal in any language
 * - ONE API for all services
 * - Share traversal logic
 * - Consistent behavior
 *
 * Use cases:
 * - Event delegation
 * - Parent element finding
 * - DOM traversal
 * - Element matching
 *
 * Package has ~15M downloads/week on npm!
 */

function closest(element: Element | null, selector: string): Element | null {
  if (!element) return null;

  // Use native closest if available
  if (element.closest) {
    return element.closest(selector);
  }

  // Polyfill implementation
  let current: Element | null = element;

  while (current && current.nodeType === 1) {
    if (matches(current, selector)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function matches(element: Element, selector: string): boolean {
  // Use native matches
  if (element.matches) {
    return element.matches(selector);
  }

  // Fallback for older browsers
  const matchesMethod =
    (element as any).webkitMatchesSelector ||
    (element as any).mozMatchesSelector ||
    (element as any).msMatchesSelector;

  if (matchesMethod) {
    return matchesMethod.call(element, selector);
  }

  // Last resort: manual check
  const matches = element.ownerDocument?.querySelectorAll(selector);
  return matches ? Array.from(matches).includes(element) : false;
}

function closestChild(parent: Element, child: Element | null, selector: string): Element | null {
  if (!child) return null;

  let current: Element | null = child;

  while (current && current !== parent) {
    if (matches(current, selector)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function parentsUntil(element: Element, selector: string, filter?: string): Element[] {
  const parents: Element[] = [];
  let current: Element | null = element.parentElement;

  while (current) {
    if (matches(current, selector)) {
      break;
    }
    if (!filter || matches(current, filter)) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  return parents;
}

export default closest;
export { closest, matches, closestChild, parentsUntil };

// CLI Demo
if (import.meta.url.includes("elide-dom-closest.ts")) {
  console.log("✅ DOM Closest - Find Closest Element (POLYGLOT!)\n");

  console.log("Example closest operations:");
  console.log("  closest(element, '.container')");
  console.log("  closest(element, 'article')");
  console.log("  closest(button, '[data-action]')");
  console.log("  closestChild(parent, child, '.item')");

  console.log("\n🚀 ~15M downloads/week on npm!");
  console.log("💡 Essential for event delegation!");
}
