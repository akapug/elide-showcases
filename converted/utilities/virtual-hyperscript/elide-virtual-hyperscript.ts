/**
 * Virtual Hyperscript - Virtual DOM h() Function
 *
 * Create virtual DOM nodes with hyperscript syntax.
 * **POLYGLOT SHOWCASE**: One virtual h() for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/virtual-hyperscript (~3M downloads/week)
 *
 * Features:
 * - Virtual node creation
 * - Hyperscript syntax
 * - Props and children
 * - Key support
 * - Event handlers
 * - Lightweight
 *
 * Polyglot Benefits:
 * - Virtual DOM in any language
 * - ONE API for all services
 * - Share VDOM logic
 * - Framework agnostic
 *
 * Use cases:
 * - Virtual DOM creation
 * - Component rendering
 * - UI frameworks
 * - Template systems
 *
 * Package has ~3M downloads/week on npm!
 */

interface VNode {
  type: string;
  props: Record<string, any>;
  children: (VNode | string)[];
  key?: string | number;
}

type Child = VNode | string | number | boolean | null | undefined;

function h(
  type: string,
  props?: Record<string, any> | Child | Child[],
  ...children: Child[]
): VNode {
  let nodeProps: Record<string, any> = {};
  let nodeChildren: Child[] = children;

  // Handle optional props
  if (props !== null && props !== undefined) {
    if (
      typeof props === 'object' &&
      !Array.isArray(props) &&
      !(props as any).type // Not a VNode
    ) {
      nodeProps = props as Record<string, any>;
    } else {
      nodeChildren = [props as Child, ...children];
    }
  }

  // Flatten and filter children
  const flatChildren = flattenChildren(nodeChildren);

  return {
    type,
    props: nodeProps,
    children: flatChildren,
    key: nodeProps.key
  };
}

function flattenChildren(children: Child[]): (VNode | string)[] {
  const flattened: (VNode | string)[] = [];

  for (const child of children) {
    if (child === null || child === undefined || child === false || child === true) {
      continue;
    }

    if (Array.isArray(child)) {
      flattened.push(...flattenChildren(child));
    } else if (typeof child === 'object' && (child as VNode).type) {
      flattened.push(child as VNode);
    } else {
      flattened.push(String(child));
    }
  }

  return flattened;
}

// Fragment component
function Fragment(props: { children: Child[] }): VNode[] {
  return flattenChildren(props.children) as VNode[];
}

// Create element with children
function createElement(type: string, props: Record<string, any>, ...children: Child[]): VNode {
  return h(type, props, ...children);
}

// Sugar functions for common elements
const div = (props?: any, ...children: Child[]) => h('div', props, ...children);
const span = (props?: any, ...children: Child[]) => h('span', props, ...children);
const a = (props?: any, ...children: Child[]) => h('a', props, ...children);
const button = (props?: any, ...children: Child[]) => h('button', props, ...children);
const input = (props?: any) => h('input', props);
const p = (props?: any, ...children: Child[]) => h('p', props, ...children);
const h1 = (props?: any, ...children: Child[]) => h('h1', props, ...children);
const h2 = (props?: any, ...children: Child[]) => h('h2', props, ...children);
const ul = (props?: any, ...children: Child[]) => h('ul', props, ...children);
const li = (props?: any, ...children: Child[]) => h('li', props, ...children);

export default h;
export { h, Fragment, createElement, div, span, a, button, input, p, h1, h2, ul, li };
export type { VNode, Child };

// CLI Demo
if (import.meta.url.includes("elide-virtual-hyperscript.ts")) {
  console.log("✅ Virtual Hyperscript - Virtual h() (POLYGLOT!)\n");

  const vnode = h('div', { className: 'container' }, [
    h('h1', 'Hello'),
    h('p', { style: { color: 'blue' } }, 'World')
  ]);

  console.log("Virtual node created:");
  console.log("  Type:", vnode.type);
  console.log("  Props:", vnode.props);
  console.log("  Children:", vnode.children.length);

  console.log("\n🚀 ~3M downloads/week on npm!");
  console.log("💡 Create virtual DOM with h()!");
}
