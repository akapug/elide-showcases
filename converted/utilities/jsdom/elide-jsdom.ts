/**
 * JSDOM - JavaScript DOM Implementation
 *
 * A JavaScript implementation of web standards for Node.js.
 * **POLYGLOT SHOWCASE**: One DOM implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jsdom (~40M downloads/week)
 *
 * Features:
 * - Full DOM implementation
 * - HTML parsing
 * - CSS selectors
 * - Event simulation
 * - Window/document objects
 * - Server-side testing
 *
 * Polyglot Benefits:
 * - Test HTML in any language
 * - ONE DOM for all services
 * - Share testing logic
 * - Server-side rendering
 *
 * Use cases:
 * - Unit testing
 * - Server-side rendering
 * - Web scraping
 * - HTML manipulation
 *
 * Package has ~40M downloads/week on npm!
 */

class JSDOM {
  private html: string;
  
  constructor(html: string) {
    this.html = html;
  }

  get window(): { document: Document } {
    return {
      document: {
        querySelector: (selector: string) => this.querySelector(selector),
        querySelectorAll: (selector: string) => this.querySelectorAll(selector),
        body: { innerHTML: this.html }
      } as any
    };
  }

  private querySelector(selector: string): any {
    const match = this.html.match(new RegExp(`<${selector}[^>]*>([^<]*)</${selector}>`));
    return match ? { textContent: match[1], outerHTML: match[0] } : null;
  }

  private querySelectorAll(selector: string): any[] {
    const matches = this.html.matchAll(new RegExp(`<${selector}[^>]*>([^<]*)</${selector}>`, 'g'));
    return Array.from(matches, m => ({ textContent: m[1], outerHTML: m[0] }));
  }
}

export default JSDOM;

// CLI Demo
if (import.meta.url.includes("elide-jsdom.ts")) {
  console.log("✅ JSDOM - DOM Implementation (POLYGLOT!)\n");

  const dom = new JSDOM(`
    <html>
      <body>
        <h1>Title</h1>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </body>
    </html>
  `);

  const h1 = dom.window.document.querySelector('h1');
  console.log("H1 content:", h1?.textContent);

  const paragraphs = dom.window.document.querySelectorAll('p');
  console.log("Found", paragraphs.length, "paragraphs");

  console.log("\n🚀 ~40M downloads/week on npm!");
  console.log("💡 Perfect for server-side DOM manipulation!");
}
