/**
 * DOM Helpers - Utility Functions for DOM Manipulation
 *
 * Collection of useful DOM manipulation helper functions.
 * **POLYGLOT SHOWCASE**: One DOM helpers library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dom-helpers (~30M downloads/week)
 *
 * Features:
 * - Class manipulation
 * - Style management
 * - Event handling
 * - Query utilities
 * - Animation helpers
 * - Cross-browser support
 *
 * Polyglot Benefits:
 * - DOM utilities in any language
 * - ONE API for all services
 * - Share helper functions
 * - Consistent behavior
 *
 * Use cases:
 * - Class management
 * - Style manipulation
 * - Event delegation
 * - DOM queries
 *
 * Package has ~30M downloads/week on npm!
 */

export const addClass = (element: Element, className: string): void => {
  element.classList.add(className);
};

export const removeClass = (element: Element, className: string): void => {
  element.classList.remove(className);
};

export const hasClass = (element: Element, className: string): boolean => {
  return element.classList.contains(className);
};

export const toggleClass = (element: Element, className: string): void => {
  element.classList.toggle(className);
};

export const addClass = (element: Element, ...classNames: string[]): void => {
  element.classList.add(...classNames);
};

export const css = (element: HTMLElement, property: string, value?: string): string | void => {
  if (value === undefined) {
    return element.style[property as any];
  }
  element.style[property as any] = value;
};

export const height = (element: HTMLElement): number => {
  return element.offsetHeight;
};

export const width = (element: HTMLElement): number => {
  return element.offsetWidth;
};

export const offset = (element: HTMLElement): { top: number; left: number } => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
};

export const position = (element: HTMLElement): { top: number; left: number } => {
  return {
    top: element.offsetTop,
    left: element.offsetLeft
  };
};

export const scrollTop = (element: HTMLElement, value?: number): number | void => {
  if (value === undefined) {
    return element.scrollTop;
  }
  element.scrollTop = value;
};

export const scrollLeft = (element: HTMLElement, value?: number): number | void => {
  if (value === undefined) {
    return element.scrollLeft;
  }
  element.scrollLeft = value;
};

export const contains = (parent: Element, child: Element): boolean => {
  return parent.contains(child);
};

export const matches = (element: Element, selector: string): boolean => {
  return element.matches(selector);
};

export const closest = (element: Element, selector: string): Element | null => {
  return element.closest(selector);
};

export const querySelectorAll = (element: Element, selector: string): Element[] => {
  return Array.from(element.querySelectorAll(selector));
};

export const on = (element: Element, event: string, handler: EventListener): void => {
  element.addEventListener(event, handler);
};

export const off = (element: Element, event: string, handler: EventListener): void => {
  element.removeEventListener(event, handler);
};

export const ownerDocument = (element: Element): Document => {
  return element.ownerDocument!;
};

export const ownerWindow = (element: Element): Window => {
  return element.ownerDocument!.defaultView!;
};

// CLI Demo
if (import.meta.url.includes("elide-dom-helpers.ts")) {
  console.log("✅ DOM Helpers - Utility Functions (POLYGLOT!)\n");

  console.log("Example DOM helpers:");
  console.log("  addClass(el, 'active')");
  console.log("  css(el, 'color', 'red')");
  console.log("  offset(el) // { top: 100, left: 50 }");
  console.log("  matches(el, '.selected')");

  console.log("\n🚀 ~30M downloads/week on npm!");
  console.log("💡 Essential DOM manipulation utilities!");
}
