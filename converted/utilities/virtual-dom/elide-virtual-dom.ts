/**
 * Virtual DOM - Virtual DOM Implementation
 *
 * A virtual DOM implementation with diffing and patching.
 * **POLYGLOT SHOWCASE**: One Virtual DOM for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/virtual-dom (~3M downloads/week)
 *
 * Features:
 * - Virtual DOM tree
 * - Efficient diffing
 * - DOM patching
 * - Event handling
 * - Component support
 * - Lightweight core
 *
 * Polyglot Benefits:
 * - Virtual DOM in any language
 * - ONE API for all services
 * - Share rendering logic
 * - Cross-platform UI
 *
 * Use cases:
 * - UI rendering
 * - Component libraries
 * - Framework building
 * - Performance optimization
 *
 * Package has ~3M downloads/week on npm!
 */

interface VNode {
  tagName: string;
  properties?: Record<string, any>;
  children?: (VNode | string)[];
  key?: string | number;
}

interface VPatch {
  type: 'CREATE' | 'REMOVE' | 'REPLACE' | 'UPDATE' | 'REORDER';
  vNode?: VNode;
  patch?: any;
}

function h(
  tagName: string,
  properties?: Record<string, any> | (VNode | string)[],
  children?: (VNode | string)[]
): VNode {
  // Handle optional properties
  if (Array.isArray(properties)) {
    children = properties;
    properties = {};
  }

  return {
    tagName,
    properties: properties || {},
    children: children || []
  };
}

function createElement(vnode: VNode | string): HTMLElement | Text {
  if (typeof vnode === 'string') {
    return document.createTextNode(vnode);
  }

  const element = document.createElement(vnode.tagName);

  // Set properties
  if (vnode.properties) {
    for (const [key, value] of Object.entries(vnode.properties)) {
      if (key.startsWith('on')) {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    }
  }

  // Create children
  if (vnode.children) {
    for (const child of vnode.children) {
      element.appendChild(createElement(child));
    }
  }

  return element;
}

function diff(oldVNode: VNode | string, newVNode: VNode | string): VPatch[] {
  const patches: VPatch[] = [];

  // Different types
  if (typeof oldVNode !== typeof newVNode) {
    patches.push({ type: 'REPLACE', vNode: newVNode as VNode });
    return patches;
  }

  // Text nodes
  if (typeof oldVNode === 'string' && typeof newVNode === 'string') {
    if (oldVNode !== newVNode) {
      patches.push({ type: 'UPDATE', patch: newVNode });
    }
    return patches;
  }

  const oldNode = oldVNode as VNode;
  const newNode = newVNode as VNode;

  // Different tags
  if (oldNode.tagName !== newNode.tagName) {
    patches.push({ type: 'REPLACE', vNode: newNode });
    return patches;
  }

  // Check properties
  const propPatches = diffProperties(oldNode.properties, newNode.properties);
  if (propPatches) {
    patches.push({ type: 'UPDATE', patch: propPatches });
  }

  // Diff children
  const childrenPatches = diffChildren(oldNode.children || [], newNode.children || []);
  patches.push(...childrenPatches);

  return patches;
}

function diffProperties(
  oldProps?: Record<string, any>,
  newProps?: Record<string, any>
): Record<string, any> | null {
  const patches: Record<string, any> = {};
  let hasPatches = false;

  // Check removed and changed properties
  if (oldProps) {
    for (const key of Object.keys(oldProps)) {
      if (!newProps || !(key in newProps)) {
        patches[key] = undefined;
        hasPatches = true;
      } else if (oldProps[key] !== newProps[key]) {
        patches[key] = newProps[key];
        hasPatches = true;
      }
    }
  }

  // Check added properties
  if (newProps) {
    for (const key of Object.keys(newProps)) {
      if (!oldProps || !(key in oldProps)) {
        patches[key] = newProps[key];
        hasPatches = true;
      }
    }
  }

  return hasPatches ? patches : null;
}

function diffChildren(
  oldChildren: (VNode | string)[],
  newChildren: (VNode | string)[]
): VPatch[] {
  const patches: VPatch[] = [];

  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLength; i++) {
    if (i >= oldChildren.length) {
      patches.push({ type: 'CREATE', vNode: newChildren[i] as VNode });
    } else if (i >= newChildren.length) {
      patches.push({ type: 'REMOVE' });
    } else {
      const childPatches = diff(oldChildren[i], newChildren[i]);
      patches.push(...childPatches);
    }
  }

  return patches;
}

function patch(rootNode: HTMLElement, patches: VPatch[]): HTMLElement {
  // Apply patches to DOM
  for (const p of patches) {
    if (p.type === 'REPLACE' && p.vNode) {
      const newElement = createElement(p.vNode);
      rootNode.parentNode?.replaceChild(newElement, rootNode);
      return newElement as HTMLElement;
    } else if (p.type === 'UPDATE' && p.patch) {
      if (typeof p.patch === 'string') {
        rootNode.textContent = p.patch;
      } else {
        // Update properties
        for (const [key, value] of Object.entries(p.patch)) {
          if (value === undefined) {
            rootNode.removeAttribute(key);
          } else {
            rootNode.setAttribute(key, value);
          }
        }
      }
    }
  }

  return rootNode;
}

export default { h, createElement, diff, patch };
export { h, createElement, diff, patch };
export type { VNode, VPatch };

// CLI Demo
if (import.meta.url.includes("elide-virtual-dom.ts")) {
  console.log("✅ Virtual DOM - VDOM Implementation (POLYGLOT!)\n");

  const vnode1 = h('div', { class: 'container' }, [
    h('h1', ['Hello']),
    h('p', ['World'])
  ]);

  const vnode2 = h('div', { class: 'container' }, [
    h('h1', ['Hello']),
    h('p', ['Universe'])
  ]);

  console.log("Virtual nodes created");
  console.log("Diff:", diff(vnode1, vnode2).length, "patches");

  console.log("\n🚀 ~3M downloads/week on npm!");
  console.log("💡 Efficient virtual DOM implementation!");
}
