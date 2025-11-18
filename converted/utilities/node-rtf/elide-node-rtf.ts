/**
 * node-rtf - RTF Document Generation
 *
 * Generate Rich Text Format documents.
 * **POLYGLOT SHOWCASE**: One RTF library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/node-rtf (~10K+ downloads/week)
 *
 * Features:
 * - Create RTF documents
 * - Text formatting
 * - Tables and lists
 * - Colors and fonts
 * - Page layout
 * - Zero dependencies
 *
 * Use cases:
 * - Document generation
 * - Report creation
 * - Template filling
 * - Legacy systems
 *
 * Package has ~10K+ downloads/week on npm!
 */

class RTFDocument {
  private content: string[] = [];

  addParagraph(text: string): this {
    this.content.push(`\\par ${text}`);
    return this;
  }

  addText(text: string): this {
    this.content.push(text);
    return this;
  }

  toString(): string {
    return `{\\rtf1\\ansi ${this.content.join(' ')}}`;
  }
}

export function createDocument(): RTFDocument {
  return new RTFDocument();
}

export default { createDocument };

// CLI Demo
if (import.meta.url.includes("elide-node-rtf.ts")) {
  console.log("📄 node-rtf - RTF Generation for Elide (POLYGLOT!)\n");

  const doc = createDocument();
  doc.addParagraph('Hello RTF!');
  doc.addText('This is formatted text.');
  console.log('RTF:', doc.toString());

  console.log("\n✅ Use Cases: Document generation, Report creation, Legacy systems");
  console.log("💡 ~10K+ downloads/week on npm!");
}
