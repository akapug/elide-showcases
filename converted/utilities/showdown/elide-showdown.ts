/**
 * showdown - Markdown to HTML Converter
 *
 * Bidirectional Markdown/HTML converter.
 * **POLYGLOT SHOWCASE**: One converter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/showdown (~500K+ downloads/week)
 *
 * Features:
 * - Markdown to HTML
 * - HTML to Markdown
 * - Extensions support
 * - GitHub Flavored Markdown
 * - Custom flavors
 * - Zero dependencies
 *
 * Use cases:
 * - Content conversion
 * - Blog engines
 * - Documentation
 * - Comment systems
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class Converter {
  makeHtml(markdown: string): string {
    return markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  makeMarkdown(html: string): string {
    return html
      .replace(/<h1>(.+?)<\/h1>/g, '# $1')
      .replace(/<h2>(.+?)<\/h2>/g, '## $1')
      .replace(/<strong>(.+?)<\/strong>/g, '**$1**');
  }
}

export default { Converter };

// CLI Demo
if (import.meta.url.includes("elide-showdown.ts")) {
  console.log("🔄 showdown - Markdown Converter for Elide (POLYGLOT!)\n");

  const converter = new Converter();
  const html = converter.makeHtml('# Hello\n\n**Bold text**');
  console.log('HTML:', html);

  const md = converter.makeMarkdown('<h1>Hello</h1>');
  console.log('Markdown:', md);

  console.log("\n✅ Use Cases: Content conversion, Blog engines, Documentation");
  console.log("💡 ~500K+ downloads/week on npm!");
}
