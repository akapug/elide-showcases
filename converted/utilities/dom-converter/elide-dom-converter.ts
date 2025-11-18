/**
 * DOM Converter - Convert Between DOM Formats
 *
 * Utilities for converting between different DOM representations.
 * **POLYGLOT SHOWCASE**: One DOM converter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dom-converter (~500K downloads/week)
 *
 * Features:
 * - DOM to JSON conversion
 * - JSON to DOM conversion
 * - HTML to object conversion
 * - Serialization/deserialization
 * - Preserve attributes
 * - Deep cloning
 *
 * Polyglot Benefits:
 * - DOM conversion in any language
 * - ONE API for all services
 * - Share conversion logic
 * - Format interoperability
 *
 * Use cases:
 * - DOM serialization
 * - State persistence
 * - Data transfer
 * - Format conversion
 *
 * Package has ~500K downloads/week on npm!
 */

interface DOMNode {
  type: 'element' | 'text' | 'comment';
  tagName?: string;
  textContent?: string;
  attributes?: Record<string, string>;
  children?: DOMNode[];
}

class DOMConverter {
  static toJSON(element: Element | Node): DOMNode {
    if (element.nodeType === Node.TEXT_NODE) {
      return {
        type: 'text',
        textContent: element.textContent || ''
      };
    }

    if (element.nodeType === Node.COMMENT_NODE) {
      return {
        type: 'comment',
        textContent: element.textContent || ''
      };
    }

    const node: DOMNode = {
      type: 'element',
      tagName: (element as Element).tagName?.toLowerCase(),
      attributes: this.getAttributes(element as Element),
      children: this.getChildren(element)
    };

    return node;
  }

  static fromJSON(node: DOMNode): Element | Text | Comment {
    if (node.type === 'text') {
      return document.createTextNode(node.textContent || '');
    }

    if (node.type === 'comment') {
      return document.createComment(node.textContent || '');
    }

    const element = document.createElement(node.tagName || 'div');

    // Set attributes
    if (node.attributes) {
      for (const [key, value] of Object.entries(node.attributes)) {
        element.setAttribute(key, value);
      }
    }

    // Append children
    if (node.children) {
      for (const child of node.children) {
        element.appendChild(this.fromJSON(child));
      }
    }

    return element;
  }

  static toObject(element: Element): any {
    const obj: any = {
      tag: element.tagName.toLowerCase()
    };

    // Get attributes
    const attrs = this.getAttributes(element);
    if (Object.keys(attrs).length > 0) {
      obj.attrs = attrs;
    }

    // Get text content
    const text = this.getDirectText(element);
    if (text) {
      obj.text = text;
    }

    // Get children
    const children = Array.from(element.children);
    if (children.length > 0) {
      obj.children = children.map(child => this.toObject(child));
    }

    return obj;
  }

  static fromObject(obj: any): Element {
    const element = document.createElement(obj.tag || 'div');

    // Set attributes
    if (obj.attrs) {
      for (const [key, value] of Object.entries(obj.attrs)) {
        element.setAttribute(key, String(value));
      }
    }

    // Set text
    if (obj.text) {
      element.textContent = obj.text;
    }

    // Append children
    if (obj.children) {
      for (const child of obj.children) {
        element.appendChild(this.fromObject(child));
      }
    }

    return element;
  }

  static clone(element: Element): Element {
    return this.fromJSON(this.toJSON(element)) as Element;
  }

  static serialize(element: Element): string {
    return JSON.stringify(this.toJSON(element), null, 2);
  }

  static deserialize(json: string): Element | Text | Comment {
    const node = JSON.parse(json) as DOMNode;
    return this.fromJSON(node);
  }

  private static getAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }

    return attrs;
  }

  private static getChildren(element: Node): DOMNode[] {
    const children: DOMNode[] = [];

    for (let i = 0; i < element.childNodes.length; i++) {
      children.push(this.toJSON(element.childNodes[i]));
    }

    return children;
  }

  private static getDirectText(element: Element): string {
    let text = '';

    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    }

    return text.trim();
  }
}

export default DOMConverter;
export { DOMConverter };
export type { DOMNode };

// CLI Demo
if (import.meta.url.includes("elide-dom-converter.ts")) {
  console.log("✅ DOM Converter - DOM Format Conversion (POLYGLOT!)\n");

  console.log("Example DOM conversion:");
  console.log("  DOMConverter.toJSON(element)");
  console.log("  DOMConverter.fromJSON(json)");
  console.log("  DOMConverter.serialize(element)");
  console.log("  DOMConverter.clone(element)");

  console.log("\n🚀 ~500K downloads/week on npm!");
  console.log("💡 Convert between DOM formats!");
}
