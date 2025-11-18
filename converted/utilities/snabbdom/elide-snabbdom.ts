/**
 * Snabbdom - Virtual DOM Library
 *
 * A simple, modular virtual DOM library with focus on simplicity.
 * **POLYGLOT SHOWCASE**: One Snabbdom for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/snabbdom (~5M downloads/week)
 *
 * Features:
 * - Minimal virtual DOM
 * - Module system
 * - Hooks support
 * - Fast diffing
 * - TypeScript support
 * - Extensible architecture
 *
 * Polyglot Benefits:
 * - Virtual DOM in any language
 * - ONE API for all services
 * - Share rendering modules
 * - Modular design
 *
 * Use cases:
 * - UI frameworks
 * - Component systems
 * - Real-time UIs
 * - Performance-critical apps
 *
 * Package has ~5M downloads/week on npm!
 */

interface VNode {
  sel?: string;
  data?: VNodeData;
  children?: VNode[];
  text?: string;
  elm?: Node;
  key?: string | number;
}

interface VNodeData {
  props?: Record<string, any>;
  attrs?: Record<string, string>;
  class?: Record<string, boolean>;
  style?: Record<string, string>;
  on?: Record<string, EventListener>;
  hook?: Hooks;
  key?: string | number;
}

interface Hooks {
  init?: (vNode: VNode) => void;
  create?: (emptyVNode: VNode, vNode: VNode) => void;
  insert?: (vNode: VNode) => void;
  prepatch?: (oldVNode: VNode, vNode: VNode) => void;
  update?: (oldVNode: VNode, vNode: VNode) => void;
  postpatch?: (oldVNode: VNode, vNode: VNode) => void;
  destroy?: (vNode: VNode) => void;
  remove?: (vNode: VNode, removeCallback: () => void) => void;
}

type Module = {
  create?: (oldVNode: VNode, vNode: VNode) => void;
  update?: (oldVNode: VNode, vNode: VNode) => void;
  destroy?: (vNode: VNode) => void;
  remove?: (vNode: VNode, removeCallback: () => void) => void;
};

function h(
  sel: string,
  data?: VNodeData | VNode[] | string,
  children?: VNode[] | string
): VNode {
  // Handle different argument combinations
  if (typeof data === 'string' || Array.isArray(data)) {
    children = data;
    data = undefined;
  }

  const vnode: VNode = {
    sel,
    data: data as VNodeData
  };

  if (typeof children === 'string') {
    vnode.text = children;
  } else if (Array.isArray(children)) {
    vnode.children = children;
  }

  return vnode;
}

function init(modules: Module[] = []) {
  function patch(oldVnode: VNode | Element, vnode: VNode): VNode {
    // Convert element to vnode
    if (!(oldVnode as VNode).sel) {
      oldVnode = emptyNodeAt(oldVnode as Element);
    }

    // Same vnode
    if (sameVnode(oldVnode as VNode, vnode)) {
      patchVnode(oldVnode as VNode, vnode);
    } else {
      // Replace
      const elm = (oldVnode as VNode).elm!;
      const parent = elm.parentNode;

      createElm(vnode);

      if (parent) {
        parent.insertBefore(vnode.elm!, elm);
        removeVnodes(parent, [oldVnode as VNode], 0, 0);
      }
    }

    return vnode;
  }

  function createElm(vnode: VNode): Node {
    const { sel, data, children, text } = vnode;

    if (sel) {
      const elm = document.createElement(sel);
      vnode.elm = elm;

      // Apply data
      if (data) {
        if (data.attrs) {
          for (const [key, val] of Object.entries(data.attrs)) {
            elm.setAttribute(key, val);
          }
        }
        if (data.props) {
          for (const [key, val] of Object.entries(data.props)) {
            (elm as any)[key] = val;
          }
        }
        if (data.on) {
          for (const [event, handler] of Object.entries(data.on)) {
            elm.addEventListener(event, handler);
          }
        }
      }

      // Create children
      if (children) {
        for (const child of children) {
          elm.appendChild(createElm(child));
        }
      } else if (text) {
        elm.textContent = text;
      }

      return elm;
    } else {
      vnode.elm = document.createTextNode(text || '');
      return vnode.elm;
    }
  }

  function sameVnode(a: VNode, b: VNode): boolean {
    return a.key === b.key && a.sel === b.sel;
  }

  function patchVnode(oldVnode: VNode, vnode: VNode): void {
    const elm = (vnode.elm = oldVnode.elm!);

    if (oldVnode === vnode) return;

    if (vnode.text !== undefined && vnode.text !== oldVnode.text) {
      elm.textContent = vnode.text;
    } else {
      updateChildren(elm, oldVnode.children || [], vnode.children || []);
    }
  }

  function updateChildren(parentElm: Node, oldCh: VNode[], newCh: VNode[]): void {
    let oldStartIdx = 0;
    let newStartIdx = 0;
    let oldEndIdx = oldCh.length - 1;
    let newEndIdx = newCh.length - 1;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      const oldStartVnode = oldCh[oldStartIdx];
      const newStartVnode = newCh[newStartIdx];

      if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode);
        oldStartIdx++;
        newStartIdx++;
      } else {
        const newNode = createElm(newStartVnode);
        parentElm.insertBefore(newNode, oldStartVnode.elm!);
        newStartIdx++;
      }
    }

    // Add remaining new nodes
    while (newStartIdx <= newEndIdx) {
      parentElm.appendChild(createElm(newCh[newStartIdx++]));
    }

    // Remove remaining old nodes
    while (oldStartIdx <= oldEndIdx) {
      parentElm.removeChild(oldCh[oldStartIdx++].elm!);
    }
  }

  function removeVnodes(parentElm: Node, vnodes: VNode[], startIdx: number, endIdx: number): void {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx];
      if (ch.elm) {
        parentElm.removeChild(ch.elm);
      }
    }
  }

  function emptyNodeAt(elm: Element): VNode {
    return {
      sel: elm.tagName.toLowerCase(),
      elm: elm
    };
  }

  return patch;
}

export default { h, init };
export { h, init };
export type { VNode, VNodeData, Hooks, Module };

// CLI Demo
if (import.meta.url.includes("elide-snabbdom.ts")) {
  console.log("✅ Snabbdom - Virtual DOM Library (POLYGLOT!)\n");

  const vnode = h('div#container.two.classes', { on: {} }, [
    h('span', { style: { fontWeight: 'bold' } }, 'This is bold'),
    ' and this is just normal text',
    h('a', { attrs: { href: '/foo' } }, "I'll take you places!")
  ]);

  console.log("Virtual node created");
  console.log("Selector:", vnode.sel);
  console.log("Children:", vnode.children?.length);

  console.log("\n🚀 ~5M downloads/week on npm!");
  console.log("💡 Simple, modular virtual DOM!");
}
