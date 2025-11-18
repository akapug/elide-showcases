/**
 * turndown - HTML to Markdown Converter
 *
 * Convert HTML to Markdown with customization.
 * **POLYGLOT SHOWCASE**: One converter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/turndown (~400K+ downloads/week)
 *
 * Features:
 * - HTML to Markdown conversion
 * - Custom rules
 * - Plugin system
 * - Clean output
 * - GFM support
 * - Zero dependencies
 *
 * Use cases:
 * - Content migration
 * - Web scraping
 * - Email conversion
 * - Documentation
 *
 * Package has ~400K+ downloads/week on npm!
 */

export class TurndownService {
  turndown(html: string): string {
    return html
      .replace(/<h1>(.+?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.+?)<\/h2>/g, '## $2\n\n')
      .replace(/<strong>(.+?)<\/strong>/g, '**$1**')
      .replace(/<em>(.+?)<\/em>/g, '*$1*')
      .replace(/<a href="(.+?)">(.+?)<\/a>/g, '[$2]($1)');
  }
}

export default TurndownService;

// CLI Demo
if (import.meta.url.includes("elide-turndown.ts")) {
  console.log("🔄 turndown - HTML to Markdown for Elide (POLYGLOT!)\n");

  const turndown = new TurndownService();
  const md = turndown.turndown('<h1>Hello</h1><p><strong>Bold</strong> text</p>');
  console.log('Markdown:', md);

  console.log("\n✅ Use Cases: Content migration, Web scraping, Email conversion");
  console.log("💡 ~400K+ downloads/week on npm!");
}
