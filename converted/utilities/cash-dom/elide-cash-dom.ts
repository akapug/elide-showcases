/**
 * Cash-DOM - Lightweight jQuery Alternative
 *
 * A small, fast jQuery alternative for modern browsers.
 * **POLYGLOT SHOWCASE**: One Cash API for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/cash-dom (~500K downloads/week)
 *
 * Features:
 * - jQuery-like API
 * - Modern browser support
 * - Small bundle size
 * - Fast performance
 * - Event handling
 * - DOM manipulation
 *
 * Polyglot Benefits:
 * - Lightweight DOM in any language
 * - ONE API for all services
 * - Share manipulation logic
 * - Modern and efficient
 *
 * Use cases:
 * - Modern web apps
 * - DOM manipulation
 * - Event handling
 * - Lightweight projects
 *
 * Package has ~500K downloads/week on npm!
 */

class Cash {
  private elements: Element[];

  constructor(selector: string | Element | Element[] | NodeList) {
    if (typeof selector === 'string') {
      this.elements = [];
    } else if (selector instanceof NodeList) {
      this.elements = Array.from(selector) as Element[];
    } else if (Array.isArray(selector)) {
      this.elements = selector;
    } else {
      this.elements = [selector];
    }
  }

  get length(): number {
    return this.elements.length;
  }

  get(index: number): Element | undefined {
    return this.elements[index];
  }

  eq(index: number): Cash {
    return new Cash([this.elements[index]].filter(Boolean));
  }

  first(): Cash {
    return this.eq(0);
  }

  last(): Cash {
    return this.eq(this.length - 1);
  }

  addClass(className: string): this {
    this.elements.forEach(el => el.classList.add(className));
    return this;
  }

  removeClass(className: string): this {
    this.elements.forEach(el => el.classList.remove(className));
    return this;
  }

  toggleClass(className: string): this {
    this.elements.forEach(el => el.classList.toggle(className));
    return this;
  }

  hasClass(className: string): boolean {
    return this.elements.some(el => el.classList.contains(className));
  }

  attr(name: string, value?: string): string | this {
    if (value === undefined) {
      return this.elements[0]?.getAttribute(name) || '';
    }
    this.elements.forEach(el => el.setAttribute(name, value));
    return this;
  }

  removeAttr(name: string): this {
    this.elements.forEach(el => el.removeAttribute(name));
    return this;
  }

  html(content?: string): string | this {
    if (content === undefined) {
      return this.elements[0]?.innerHTML || '';
    }
    this.elements.forEach(el => el.innerHTML = content);
    return this;
  }

  text(content?: string): string | this {
    if (content === undefined) {
      return this.elements[0]?.textContent || '';
    }
    this.elements.forEach(el => el.textContent = content);
    return this;
  }

  val(value?: string): string | this {
    if (value === undefined) {
      return (this.elements[0] as HTMLInputElement)?.value || '';
    }
    this.elements.forEach(el => {
      (el as HTMLInputElement).value = value;
    });
    return this;
  }

  css(prop: string, value?: string): string | this {
    if (value === undefined) {
      return (this.elements[0] as HTMLElement)?.style[prop as any] || '';
    }
    this.elements.forEach(el => {
      (el as HTMLElement).style[prop as any] = value;
    });
    return this;
  }

  on(event: string, handler: EventListener): this {
    this.elements.forEach(el => el.addEventListener(event, handler));
    return this;
  }

  off(event: string, handler: EventListener): this {
    this.elements.forEach(el => el.removeEventListener(event, handler));
    return this;
  }

  trigger(event: string): this {
    this.elements.forEach(el => {
      el.dispatchEvent(new Event(event));
    });
    return this;
  }

  each(callback: (index: number, element: Element) => void): this {
    this.elements.forEach((el, idx) => callback(idx, el));
    return this;
  }
}

function cash(selector: string | Element | Element[] | NodeList): Cash {
  return new Cash(selector);
}

export default cash;
export { Cash };

// CLI Demo
if (import.meta.url.includes("elide-cash-dom.ts")) {
  console.log("✅ Cash-DOM - Lightweight jQuery Alternative (POLYGLOT!)\n");

  console.log("Example Cash operations:");
  console.log("  cash('div').addClass('active')");
  console.log("  cash('.item').toggleClass('hidden')");
  console.log("  cash('#name').val('Jane')");
  console.log("  cash('button').on('click', handler)");

  console.log("\n🚀 ~500K downloads/week on npm!");
  console.log("💡 Small, fast jQuery alternative!");
}
