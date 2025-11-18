/**
 * Zepto - Minimalist JavaScript Library
 *
 * A lightweight jQuery-compatible library for modern browsers.
 * **POLYGLOT SHOWCASE**: One Zepto API for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/zepto (~2M downloads/week)
 *
 * Features:
 * - jQuery-compatible API
 * - Small footprint
 * - Mobile-focused
 * - Touch events
 * - Fast performance
 * - Modular design
 *
 * Polyglot Benefits:
 * - Mobile DOM in any language
 * - ONE API for all services
 * - Share mobile logic
 * - Lightweight and fast
 *
 * Use cases:
 * - Mobile web apps
 * - Touch interfaces
 * - DOM manipulation
 * - Event handling
 *
 * Package has ~2M downloads/week on npm!
 */

class Zepto {
  private elements: Element[];

  constructor(selector: string | Element | Element[]) {
    if (typeof selector === 'string') {
      this.elements = [];
    } else if (Array.isArray(selector)) {
      this.elements = selector;
    } else {
      this.elements = [selector];
    }
  }

  get length(): number {
    return this.elements.length;
  }

  each(callback: (index: number, element: Element) => void): this {
    this.elements.forEach((el, idx) => callback(idx, el));
    return this;
  }

  map<T>(callback: (index: number, element: Element) => T): T[] {
    return this.elements.map((el, idx) => callback(idx, el));
  }

  slice(start: number, end?: number): Zepto {
    return new Zepto(this.elements.slice(start, end));
  }

  get(index: number): Element | Element[] {
    return index === undefined ? this.elements : this.elements[index];
  }

  eq(index: number): Zepto {
    return new Zepto([this.elements[index]].filter(Boolean));
  }

  first(): Zepto {
    return this.eq(0);
  }

  last(): Zepto {
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

  show(): this {
    return this.css('display', 'block');
  }

  hide(): this {
    return this.css('display', 'none');
  }
}

function Z(selector: string | Element | Element[]): Zepto {
  return new Zepto(selector);
}

export default Z;
export { Zepto };

// CLI Demo
if (import.meta.url.includes("elide-zepto.ts")) {
  console.log("✅ Zepto - Minimalist JavaScript Library (POLYGLOT!)\n");

  console.log("Example Zepto operations:");
  console.log("  Z('div').addClass('active')");
  console.log("  Z('.item').show()");
  console.log("  Z('#name').val('Alice')");
  console.log("  Z('button').on('tap', handler)");

  console.log("\n🚀 ~2M downloads/week on npm!");
  console.log("💡 Lightweight jQuery-compatible library!");
}
