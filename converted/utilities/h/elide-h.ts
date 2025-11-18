/**
 * h - Simple Hyperscript Helper
 *
 * Minimalist hyperscript function for creating elements.
 * **POLYGLOT SHOWCASE**: One h() helper for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/h (~8M downloads/week)
 *
 * Features:
 * - Minimal hyperscript
 * - Element creation
 * - Attribute setting
 * - Child appending
 * - CSS selector support
 * - Tiny footprint
 *
 * Polyglot Benefits:
 * - Element helpers in any language
 * - ONE API for all services
 * - Share creation logic
 * - Ultra-lightweight
 *
 * Use cases:
 * - Quick element creation
 * - DOM building
 * - Template helpers
 * - UI utilities
 *
 * Package has ~8M downloads/week on npm!
 */

type Attributes = Record<string, any>;
type Child = HTMLElement | Text | string | number | null | undefined;

function h(
  tagName: string,
  attributes?: Attributes | Child | Child[],
  ...children: Child[]
): HTMLElement {
  // Parse tag name for id and classes
  const parsed = parseTag(tagName);
  const element = document.createElement(parsed.tag);

  // Set id
  if (parsed.id) {
    element.id = parsed.id;
  }

  // Set classes
  if (parsed.classes.length > 0) {
    element.className = parsed.classes.join(' ');
  }

  // Handle attributes
  let attrs: Attributes = {};
  let childElements: Child[] = children;

  if (attributes !== null && attributes !== undefined) {
    if (isAttributes(attributes)) {
      attrs = attributes as Attributes;
    } else {
      childElements = [attributes as Child, ...children];
    }
  }

  // Apply attributes
  for (const [key, value] of Object.entries(attrs)) {
    setAttribute(element, key, value);
  }

  // Append children
  appendChildren(element, childElements);

  return element;
}

function parseTag(tag: string): { tag: string; id?: string; classes: string[] } {
  const parts = tag.split(/([#.])/);
  let tagName = 'div';
  let id: string | undefined;
  const classes: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (i === 0 && part && part !== '#' && part !== '.') {
      tagName = part;
    } else if (part === '#') {
      id = parts[++i];
    } else if (part === '.') {
      classes.push(parts[++i]);
    }
  }

  return { tag: tagName, id, classes };
}

function isAttributes(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof HTMLElement) &&
    !(value instanceof Text)
  );
}

function setAttribute(element: HTMLElement, key: string, value: any): void {
  if (key === 'className' || key === 'class') {
    element.className = (element.className + ' ' + value).trim();
  } else if (key === 'style' && typeof value === 'object') {
    Object.assign(element.style, value);
  } else if (key === 'dataset' && typeof value === 'object') {
    Object.assign(element.dataset, value);
  } else if (key.startsWith('on') && typeof value === 'function') {
    const event = key.substring(2).toLowerCase();
    element.addEventListener(event, value);
  } else if (key in element && key !== 'list' && key !== 'form') {
    (element as any)[key] = value;
  } else {
    element.setAttribute(key, String(value));
  }
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

// Convenience helpers
function text(content: string): Text {
  return document.createTextNode(content);
}

function fragment(...children: Child[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  const temp = document.createElement('div');
  appendChildren(temp, children);
  while (temp.firstChild) {
    frag.appendChild(temp.firstChild);
  }
  return frag;
}

export default h;
export { h, text, fragment };

// CLI Demo
if (import.meta.url.includes("elide-h.ts")) {
  console.log("✅ h - Simple Hyperscript Helper (POLYGLOT!)\n");

  console.log("Example h() usage:");
  console.log("  h('div#app')");
  console.log("  h('button.primary', 'Click')");
  console.log("  h('ul', [h('li', 'Item 1'), h('li', 'Item 2')])");
  console.log("  h('input', { type: 'text', value: 'Hello' })");

  console.log("\n🚀 ~8M downloads/week on npm!");
  console.log("💡 Minimalist hyperscript helper!");
}
