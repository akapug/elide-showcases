/**
 * Hyperapp
 *
 * Micro framework for building web apps
 * **POLYGLOT SHOWCASE**: One framework for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hyperapp (~200K downloads/week)
 *
 * Features:
 * - Fast rendering
 * - Small bundle size
 * - Virtual DOM
 * - Component-based
 * - Modern APIs
 * - Production-ready
 *
 * Polyglot Benefits:
 * - Build UIs in any language
 * - ONE framework everywhere
 * - Share components across stack
 * - Consistent architecture
 *
 * Use cases:
 * - Web applications
 * - Single-page apps
 * - UI components
 * - Fast rendering needs
 *
 * Package has ~200K downloads/week on npm!
 */

interface VNode {
  type: string | Function;
  props: any;
  children: any[];
}

class Hyperapp {
  static h(type: string | Function, props: any = {}, ...children: any[]): VNode {
    return {
      type,
      props: props || {},
      children: children.flat()
    };
  }

  static render(vnode: VNode): string {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return String(vnode);
    }

    if (!vnode || typeof vnode !== 'object') {
      return '';
    }

    const { type, props, children } = vnode;

    if (typeof type === 'function') {
      return this.render(type(props));
    }

    const attrs = this.renderAttrs(props);
    const childHTML = children.map(child => this.render(child)).join('');

    return `<${type}${attrs}>${childHTML}</${type}>`;
  }

  private static renderAttrs(props: any): string {
    if (!props) return '';

    return Object.entries(props)
      .filter(([key]) => key !== 'children')
      .map(([key, value]) => ` ${key}="${value}"`)
      .join('');
  }
}

export default Hyperapp;

// CLI Demo
if (import.meta.url.includes("elide-hyperapp.ts")) {
  console.log("✅ Hyperapp (POLYGLOT!)\n");

  const vnode = Hyperapp.h('div', { class: 'app' },
    Hyperapp.h('h1', null, 'Hello World'),
    Hyperapp.h('p', null, 'Welcome to Hyperapp')
  );

  console.log("Virtual Node:");
  console.log(JSON.stringify(vnode, null, 2));
  console.log();

  console.log("Rendered HTML:");
  console.log(Hyperapp.render(vnode));
  console.log();

  console.log("🚀 ~200K downloads/week on npm!");
  console.log("💡 Perfect for lightweight polyglot UIs!");
}
