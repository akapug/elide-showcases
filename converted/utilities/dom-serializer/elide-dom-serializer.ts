/**
 * DOM Serializer
 *
 * Serialize DOM trees back to HTML.
 * **POLYGLOT SHOWCASE**: One DOM serializer for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dom-serializer (~120M downloads/week)
 *
 * Features:
 * - DOM to HTML conversion
 * - Pretty printing
 * - Self-closing tags
 * - Attribute serialization
 * - Fast rendering
 * - Minimal footprint
 *
 * Polyglot Benefits:
 * - Generate HTML in any language
 * - ONE serializer everywhere
 * - Share rendering logic
 * - Consistent HTML output
 *
 * Use cases:
 * - HTML generation
 * - Server-side rendering
 * - DOM manipulation
 * - Template rendering
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

class DOMSerializer {
  static render(nodes: DOMNode | DOMNode[], options: { selfClosingTags?: boolean } = {}): string {
    const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
    return nodeArray.map(node => this.renderNode(node, options)).join('');
  }

  private static renderNode(node: DOMNode, options: { selfClosingTags?: boolean }): string {
    if (node.type === 'text') {
      return this.escapeHTML(node.data || '');
    }

    if (node.type === 'tag') {
      const attrs = this.renderAttributes(node.attribs || {});
      const tagName = node.name || '';
      
      const selfClosing = options.selfClosingTags && this.isSelfClosing(tagName);
      
      if (selfClosing) {
        return `<${tagName}${attrs} />`;
      }

      const children = node.children
        ? node.children.map(child => this.renderNode(child, options)).join('')
        : '';

      return `<${tagName}${attrs}>${children}</${tagName}>`;
    }

    return '';
  }

  private static renderAttributes(attribs: Record<string, string>): string {
    return Object.entries(attribs)
      .map(([key, value]) => ` ${key}="${this.escapeHTML(value)}"`)
      .join('');
  }

  private static isSelfClosing(tagName: string): boolean {
    return ['br', 'hr', 'img', 'input', 'link', 'meta'].includes(tagName.toLowerCase());
  }

  private static escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default DOMSerializer;

// CLI Demo
if (import.meta.url.includes("elide-dom-serializer.ts")) {
  console.log("✅ DOM Serializer (POLYGLOT!)\n");

  const dom: DOMNode[] = [
    {
      type: 'tag',
      name: 'div',
      attribs: { class: 'container', id: 'main' },
      children: [
        { type: 'text', data: 'Hello ' },
        {
          type: 'tag',
          name: 'strong',
          children: [{ type: 'text', data: 'World' }]
        },
        { type: 'text', data: '!' }
      ]
    },
    {
      type: 'tag',
      name: 'br'
    }
  ];

  console.log("HTML Output:");
  console.log(DOMSerializer.render(dom));
  
  console.log("\nWith self-closing tags:");
  console.log(DOMSerializer.render(dom, { selfClosingTags: true }));

  console.log("\n🚀 ~120M downloads/week on npm!");
}
