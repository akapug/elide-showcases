/**
 * DOMUtils - DOM Utilities
 *
 * Utilities for working with DOM trees.
 * **POLYGLOT SHOWCASE**: One DOM utility library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/domutils (~120M downloads/week)
 *
 * Features:
 * - DOM traversal
 * - Element finding
 * - Text extraction
 * - Attribute manipulation
 * - Tree walking
 * - Filtering
 *
 * Polyglot Benefits:
 * - Manipulate DOM in any language
 * - ONE toolkit for all services
 * - Share DOM utilities
 * - Consistent operations
 *
 * Use cases:
 * - DOM manipulation
 * - Web scraping
 * - Content extraction
 * - Tree traversal
 *
 * Package has ~120M downloads/week on npm!
 */

interface DOMNode {
  type: string;
  name?: string;
  data?: string;
  children?: DOMNode[];
  attribs?: Record<string, string>;
}

class DOMUtils {
  static getText(node: DOMNode): string {
    if (node.type === 'text') {
      return node.data || '';
    }

    if (node.children) {
      return node.children.map(child => this.getText(child)).join('');
    }

    return '';
  }

  static findOne(test: (node: DOMNode) => boolean, nodes: DOMNode[]): DOMNode | null {
    for (const node of nodes) {
      if (test(node)) {
        return node;
      }

      if (node.children) {
        const found = this.findOne(test, node.children);
        if (found) return found;
      }
    }

    return null;
  }

  static findAll(test: (node: DOMNode) => boolean, nodes: DOMNode[]): DOMNode[] {
    const results: DOMNode[] = [];

    for (const node of nodes) {
      if (test(node)) {
        results.push(node);
      }

      if (node.children) {
        results.push(...this.findAll(test, node.children));
      }
    }

    return results;
  }

  static getElementsByTagName(tagName: string, nodes: DOMNode[]): DOMNode[] {
    return this.findAll(
      node => node.type === 'tag' && node.name === tagName,
      nodes
    );
  }

  static getAttributeValue(node: DOMNode, name: string): string | undefined {
    return node.attribs?.[name];
  }
}

export default DOMUtils;

// CLI Demo
if (import.meta.url.includes("elide-domutils.ts")) {
  console.log("✅ DOMUtils - DOM Utilities (POLYGLOT!)\n");

  const dom: DOMNode[] = [
    {
      type: 'tag',
      name: 'div',
      attribs: { class: 'container' },
      children: [
        { type: 'text', data: 'Hello ' },
        {
          type: 'tag',
          name: 'span',
          attribs: { id: 'name' },
          children: [{ type: 'text', data: 'World' }]
        }
      ]
    }
  ];

  console.log("Text content:", DOMUtils.getText(dom[0]));
  
  const spans = DOMUtils.getElementsByTagName('span', dom);
  console.log("Found", spans.length, "span element(s)");

  const span = spans[0];
  console.log("Span ID:", DOMUtils.getAttributeValue(span, 'id'));

  console.log("\n🚀 ~120M downloads/week on npm!");
}
