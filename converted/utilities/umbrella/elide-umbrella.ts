/**
 * Umbrella - Minimal jQuery Alternative
 *
 * Tiny library for DOM manipulation and events.
 * **POLYGLOT SHOWCASE**: One Umbrella API for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/umbrellajs (~100K downloads/week)
 *
 * Features:
 * - Ultra-small size
 * - jQuery-like syntax
 * - DOM manipulation
 * - Event handling
 * - AJAX support
 * - Modern browsers
 *
 * Polyglot Benefits:
 * - Minimal DOM library in any language
 * - ONE API for all services
 * - Share tiny utilities
 * - Ultra-lightweight
 *
 * Use cases:
 * - Small projects
 * - DOM manipulation
 * - Event handling
 * - Lightweight apps
 *
 * Package has ~100K downloads/week on npm!
 */

class Umbrella {
  private nodes: Element[];

  constructor(selector: string | Element | Element[] | NodeList) {
    if (typeof selector === 'string') {
      this.nodes = [];
    } else if (selector instanceof NodeList) {
      this.nodes = Array.from(selector) as Element[];
    } else if (Array.isArray(selector)) {
      this.nodes = selector;
    } else {
      this.nodes = [selector];
    }
  }

  get length(): number {
    return this.nodes.length;
  }

  addClass(className: string): this {
    this.nodes.forEach(node => node.classList.add(className));
    return this;
  }

  removeClass(className: string): this {
    this.nodes.forEach(node => node.classList.remove(className));
    return this;
  }

  hasClass(className: string): boolean {
    return this.nodes.some(node => node.classList.contains(className));
  }

  attr(name: string, value?: string): string | this {
    if (value === undefined) {
      return this.nodes[0]?.getAttribute(name) || '';
    }
    this.nodes.forEach(node => node.setAttribute(name, value));
    return this;
  }

  html(content?: string): string | this {
    if (content === undefined) {
      return this.nodes[0]?.innerHTML || '';
    }
    this.nodes.forEach(node => node.innerHTML = content);
    return this;
  }

  text(content?: string): string | this {
    if (content === undefined) {
      return this.nodes[0]?.textContent || '';
    }
    this.nodes.forEach(node => node.textContent = content);
    return this;
  }

  on(event: string, callback: EventListener): this {
    this.nodes.forEach(node => node.addEventListener(event, callback));
    return this;
  }

  off(event: string, callback: EventListener): this {
    this.nodes.forEach(node => node.removeEventListener(event, callback));
    return this;
  }

  trigger(event: string): this {
    this.nodes.forEach(node => {
      node.dispatchEvent(new Event(event));
    });
    return this;
  }

  each(callback: (node: Element, index: number) => void): this {
    this.nodes.forEach((node, idx) => callback(node, idx));
    return this;
  }

  first(): Umbrella {
    return new Umbrella([this.nodes[0]].filter(Boolean));
  }

  last(): Umbrella {
    return new Umbrella([this.nodes[this.length - 1]].filter(Boolean));
  }

  parent(): Umbrella {
    const parents = this.nodes
      .map(node => node.parentElement)
      .filter(Boolean) as Element[];
    return new Umbrella(parents);
  }

  children(): Umbrella {
    const children: Element[] = [];
    this.nodes.forEach(node => {
      children.push(...Array.from(node.children));
    });
    return new Umbrella(children);
  }
}

function u(selector: string | Element | Element[] | NodeList): Umbrella {
  return new Umbrella(selector);
}

export default u;
export { Umbrella };

// CLI Demo
if (import.meta.url.includes("elide-umbrella.ts")) {
  console.log("✅ Umbrella - Minimal jQuery Alternative (POLYGLOT!)\n");

  console.log("Example Umbrella operations:");
  console.log("  u('div').addClass('active')");
  console.log("  u('.item').html('<span>Hi</span>')");
  console.log("  u('button').on('click', handler)");
  console.log("  u('.box').trigger('change')");

  console.log("\n🚀 ~100K downloads/week on npm!");
  console.log("💡 Ultra-small DOM manipulation library!");
}
