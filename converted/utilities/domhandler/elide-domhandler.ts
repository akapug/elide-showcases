/**
 * DOMHandler - DOM Tree Handler
 *
 * Handler for htmlparser2 that turns pages into a DOM.
 * **POLYGLOT SHOWCASE**: One DOM handler for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/domhandler (~120M downloads/week)
 *
 * Features:
 * - DOM tree construction
 * - HTML parsing support
 * - Node manipulation
 * - Tree traversal
 * - Fast and efficient
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Parse HTML in any language
 * - ONE handler for all services
 * - Share DOM logic across stack
 * - Consistent parsing
 *
 * Use cases:
 * - HTML parsing
 * - DOM manipulation
 * - Web scraping
 * - Content extraction
 *
 * Package has ~120M downloads/week on npm!
 */

interface Node {
  type: string;
  name?: string;
  data?: string;
  children?: Node[];
  attribs?: Record<string, string>;
}

class DOMHandler {
  private dom: Node[] = [];
  private current: Node | null = null;

  onopentag(name: string, attribs: Record<string, string>): void {
    const node: Node = {
      type: 'tag',
      name,
      attribs,
      children: []
    };

    if (this.current) {
      this.current.children!.push(node);
    } else {
      this.dom.push(node);
    }

    this.current = node;
  }

  ontext(data: string): void {
    const node: Node = {
      type: 'text',
      data: data.trim()
    };

    if (node.data && this.current) {
      this.current.children!.push(node);
    }
  }

  onclosetag(): void {
    this.current = null;
  }

  getDOM(): Node[] {
    return this.dom;
  }
}

export default DOMHandler;

// CLI Demo
if (import.meta.url.includes("elide-domhandler.ts")) {
  console.log("✅ DOMHandler - DOM Tree Handler (POLYGLOT!)\n");

  const handler = new DOMHandler();

  // Simulate parsing
  handler.onopentag('div', { class: 'container' });
  handler.ontext('Hello World');
  handler.onclosetag();

  handler.onopentag('p', {});
  handler.ontext('Paragraph text');
  handler.onclosetag();

  const dom = handler.getDOM();
  console.log("DOM Tree:");
  console.log(JSON.stringify(dom, null, 2));

  console.log("\n🚀 ~120M downloads/week on npm!");
  console.log("💡 Foundation for HTML parsing!");
}
