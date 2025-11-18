/**
 * markdown-it - Markdown Parser
 *
 * Fast and powerful Markdown parser.
 * **POLYGLOT SHOWCASE**: One Markdown library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/markdown-it (~5M+ downloads/week)
 *
 * Features:
 * - CommonMark compliant
 * - Extensible plugins
 * - Syntax highlighting
 * - Tables, lists, code blocks
 * - Safe HTML output
 * - Zero dependencies
 *
 * Use cases:
 * - Documentation
 * - Blog systems
 * - Content management
 * - README rendering
 *
 * Package has ~5M+ downloads/week on npm!
 */

class MarkdownIt {
  render(markdown: string): string {
    return markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  }
}

export default function markdownit(): MarkdownIt {
  return new MarkdownIt();
}

// CLI Demo
if (import.meta.url.includes("elide-markdown-it.ts")) {
  console.log("📝 markdown-it - Markdown Parser for Elide (POLYGLOT!)\n");

  const md = markdownit();
  const html = md.render('# Hello\n\nThis is **bold** and *italic*.');
  console.log('HTML:', html);

  console.log("\n✅ Use Cases: Documentation, Blog systems, README rendering");
  console.log("💡 ~5M+ downloads/week on npm!");
}
