/**
 * DOM Walk - DOM Tree Walker
 *
 * Utility for walking and traversing DOM trees.
 * **POLYGLOT SHOWCASE**: One DOM walker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dom-walk (~40M downloads/week)
 *
 * Features:
 * - DOM tree traversal
 * - Node filtering
 * - Depth-first walking
 * - Callback support
 * - Lightweight
 * - Flexible API
 *
 * Polyglot Benefits:
 * - DOM traversal in any language
 * - ONE API for all services
 * - Share tree walking logic
 * - Consistent traversal
 *
 * Use cases:
 * - Tree traversal
 * - Node processing
 * - DOM analysis
 * - Content extraction
 *
 * Package has ~40M downloads/week on npm!
 */

type WalkCallback = (node: Node) => boolean | void;

function walk(node: Node, callback: WalkCallback): void {
  // Call callback on current node
  const shouldContinue = callback(node);

  // If callback returns false, stop walking
  if (shouldContinue === false) {
    return;
  }

  // Walk children
  const children = node.childNodes;
  for (let i = 0; i < children.length; i++) {
    walk(children[i], callback);
  }
}

function walkElements(node: Node, callback: (element: Element) => boolean | void): void {
  walk(node, (n) => {
    if (n.nodeType === 1) { // Element node
      return callback(n as Element);
    }
  });
}

function walkText(node: Node, callback: (text: Text) => boolean | void): void {
  walk(node, (n) => {
    if (n.nodeType === 3) { // Text node
      return callback(n as Text);
    }
  });
}

function walkFiltered(
  node: Node,
  filter: (node: Node) => boolean,
  callback: WalkCallback
): void {
  walk(node, (n) => {
    if (filter(n)) {
      return callback(n);
    }
  });
}

function collectNodes(node: Node, filter?: (node: Node) => boolean): Node[] {
  const nodes: Node[] = [];

  walk(node, (n) => {
    if (!filter || filter(n)) {
      nodes.push(n);
    }
  });

  return nodes;
}

function collectElements(node: Node): Element[] {
  const elements: Element[] = [];

  walkElements(node, (el) => {
    elements.push(el);
  });

  return elements;
}

function collectText(node: Node): string {
  const texts: string[] = [];

  walkText(node, (text) => {
    if (text.nodeValue) {
      texts.push(text.nodeValue);
    }
  });

  return texts.join('');
}

function findNode(node: Node, predicate: (node: Node) => boolean): Node | null {
  let found: Node | null = null;

  walk(node, (n) => {
    if (predicate(n)) {
      found = n;
      return false; // Stop walking
    }
  });

  return found;
}

export default walk;
export {
  walk,
  walkElements,
  walkText,
  walkFiltered,
  collectNodes,
  collectElements,
  collectText,
  findNode
};

// CLI Demo
if (import.meta.url.includes("elide-dom-walk.ts")) {
  console.log("✅ DOM Walk - Tree Walker (POLYGLOT!)\n");

  console.log("Example DOM walking:");
  console.log("  walk(node, n => console.log(n))");
  console.log("  walkElements(node, el => process(el))");
  console.log("  collectElements(node)");
  console.log("  findNode(node, n => n.id === 'target')");

  console.log("\n🚀 ~40M downloads/week on npm!");
  console.log("💡 Essential for DOM tree traversal!");
}
