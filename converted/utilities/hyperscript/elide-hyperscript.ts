/**
 * Hyperscript - Create HTML Elements
 *
 * Create HTML elements with a concise syntax.
 * **POLYGLOT SHOWCASE**: One hyperscript for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hyperscript (~8M downloads/week)
 *
 * Features:
 * - Concise element creation
 * - CSS selector syntax
 * - Event binding
 * - Property setting
 * - Nested children
 * - Browser compatible
 *
 * Polyglot Benefits:
 * - Element creation in any language
 * - ONE API for all services
 * - Share UI logic
 * - Simple and powerful
 *
 * Use cases:
 * - DOM element creation
 * - UI building
 * - Template rendering
 * - Component libraries
 *
 * Package has ~8M downloads/week on npm!
 */

type Child = HTMLElement | string | number | null | undefined;
type Properties = Record<string, any>;

function h(
  tagOrSelector: string,
  properties?: Properties | Child | Child[],
  ...children: Child[]
): HTMLElement {
  // Parse selector
  const { tag, id, classes } = parseSelector(tagOrSelector);

  // Create element
  const element = document.createElement(tag);

  // Handle properties
  let props: Properties = {};
  let childElements: Child[] = children;

  if (properties !== null && properties !== undefined) {
    if (
      typeof properties === 'object' &&
      !Array.isArray(properties) &&
      !(properties instanceof HTMLElement) &&
      !(properties instanceof Text)
    ) {
      props = properties as Properties;
    } else {
      childElements = [properties as Child, ...children];
    }
  }

  // Set id
  if (id) {
    element.id = id;
  }

  // Set classes
  if (classes.length > 0) {
    element.className = classes.join(' ');
  }

  // Apply properties
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      // Event listener
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'style' && typeof value === 'object') {
      // Style object
      Object.assign(element.style, value);
    } else if (key === 'className') {
      element.className = (element.className + ' ' + value).trim();
    } else if (key === 'dataset' && typeof value === 'object') {
      // Dataset
      Object.assign(element.dataset, value);
    } else if (key in element) {
      // Direct property
      (element as any)[key] = value;
    } else {
      // Attribute
      element.setAttribute(key, String(value));
    }
  }

  // Append children
  appendChildren(element, childElements);

  return element;
}

function parseSelector(selector: string): { tag: string; id?: string; classes: string[] } {
  const idMatch = selector.match(/#([^.#]+)/);
  const classMatches = selector.match(/\.([^.#]+)/g);
  const tagMatch = selector.match(/^([^.#]+)/);

  return {
    tag: tagMatch?.[1] || 'div',
    id: idMatch?.[1],
    classes: classMatches ? classMatches.map(c => c.substring(1)) : []
  };
}

function appendChildren(element: HTMLElement, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined) {
      continue;
    }

    if (Array.isArray(child)) {
      appendChildren(element, child);
    } else if (child instanceof HTMLElement || child instanceof Text) {
      element.appendChild(child);
    } else {
      element.appendChild(document.createTextNode(String(child)));
    }
  }
}

// Convenience functions for common elements
const div = (...args: any[]) => h('div', ...args);
const span = (...args: any[]) => h('span', ...args);
const a = (...args: any[]) => h('a', ...args);
const button = (...args: any[]) => h('button', ...args);
const input = (...args: any[]) => h('input', ...args);
const p = (...args: any[]) => h('p', ...args);
const ul = (...args: any[]) => h('ul', ...args);
const li = (...args: any[]) => h('li', ...args);

export default h;
export { h, div, span, a, button, input, p, ul, li };

// CLI Demo
if (import.meta.url.includes("elide-hyperscript.ts")) {
  console.log("✅ Hyperscript - Create HTML Elements (POLYGLOT!)\n");

  console.log("Example hyperscript usage:");
  console.log("  h('div#app.container')");
  console.log("  h('button', { onclick: handler }, 'Click')");
  console.log("  h('ul', [h('li', 'Item 1'), h('li', 'Item 2')])");
  console.log("  div('.box', span('Hello'))");

  console.log("\n🚀 ~8M downloads/week on npm!");
  console.log("💡 Concise HTML element creation!");
}
