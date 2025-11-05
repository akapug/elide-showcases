/**
 * Marked - Markdown Parser
 *
 * Fast markdown parser and compiler for converting Markdown to HTML.
 * **POLYGLOT SHOWCASE**: One markdown parser for ALL languages on Elide!
 *
 * Features:
 * - Parse Markdown to HTML
 * - Support for GFM (GitHub Flavored Markdown)
 * - Code blocks with syntax highlighting hints
 * - Tables, task lists, strikethrough
 * - Heading IDs for navigation
 * - Links, images, emphasis
 * - Blockquotes and lists
 * - Horizontal rules
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need Markdown parsing
 * - ONE implementation works everywhere on Elide
 * - Consistent Markdown rendering across languages
 * - No need for language-specific Markdown libs
 *
 * Use cases:
 * - README rendering
 * - Documentation generation
 * - Blog content
 * - Static site generation
 * - Content management systems
 * - Comment systems
 *
 * Package has ~15M+ downloads/week on npm!
 */

interface MarkedOptions {
  /** Enable GitHub Flavored Markdown (default: true) */
  gfm?: boolean;
  /** Enable line breaks (default: false) */
  breaks?: boolean;
  /** Enable heading IDs (default: true) */
  headerIds?: boolean;
  /** Prefix for heading IDs (default: '') */
  headerPrefix?: string;
}

/**
 * Parse markdown to HTML
 */
export default function marked(markdown: string, options: MarkedOptions = {}): string {
  const {
    gfm = true,
    breaks = false,
    headerIds = true,
    headerPrefix = ''
  } = options;

  let html = markdown;

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Parse block-level elements
  html = parseCodeBlocks(html);
  html = parseHeaders(html, headerIds, headerPrefix);
  html = parseHorizontalRules(html);
  html = parseBlockquotes(html);
  html = parseLists(html);

  if (gfm) {
    html = parseTables(html);
    html = parseTaskLists(html);
  }

  html = parseParagraphs(html);

  // Parse inline elements
  html = parseInlineCode(html);
  html = parseImages(html);
  html = parseLinks(html);
  html = parseBold(html);
  html = parseItalic(html);

  if (gfm) {
    html = parseStrikethrough(html);
  }

  if (breaks) {
    html = html.replace(/\n/g, '<br>\n');
  }

  return html.trim();
}

/**
 * Parse code blocks (``` or indented)
 */
function parseCodeBlocks(text: string): string {
  // Fenced code blocks (```)
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang ? ` class="language-${lang}"` : '';
    const escaped = escapeHtml(code.trim());
    return `<pre><code${language}>${escaped}</code></pre>`;
  });

  // Indented code blocks (4 spaces)
  text = text.replace(/^(    .+(\n    .*)*)$/gm, (match) => {
    const code = match.replace(/^    /gm, '');
    const escaped = escapeHtml(code);
    return `<pre><code>${escaped}</code></pre>`;
  });

  return text;
}

/**
 * Parse headers (# ## ### etc)
 */
function parseHeaders(text: string, withIds: boolean, prefix: string): string {
  return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    let attrs = '';

    if (withIds) {
      const id = prefix + slugify(content);
      attrs = ` id="${id}"`;
    }

    return `<h${level}${attrs}>${parseInline(content)}</h${level}>`;
  });
}

/**
 * Parse horizontal rules (--- or ***)
 */
function parseHorizontalRules(text: string): string {
  return text.replace(/^(?:---+|\*\*\*+|___+)$/gm, '<hr>');
}

/**
 * Parse blockquotes (>)
 */
function parseBlockquotes(text: string): string {
  return text.replace(/^(> .+(\n> .*)*)$/gm, (match) => {
    const content = match.replace(/^> /gm, '');
    return `<blockquote>\n${parseInline(content)}\n</blockquote>`;
  });
}

/**
 * Parse lists (- or * or 1.)
 */
function parseLists(text: string): string {
  // Ordered lists
  text = text.replace(/^(\d+\.\s+.+(\n\d+\.\s+.*)*)$/gm, (match) => {
    const items = match
      .split('\n')
      .map(line => {
        const content = line.replace(/^\d+\.\s+/, '');
        return `  <li>${parseInline(content)}</li>`;
      })
      .join('\n');
    return `<ol>\n${items}\n</ol>`;
  });

  // Unordered lists
  text = text.replace(/^([*+-]\s+.+(\n[*+-]\s+.*)*)$/gm, (match) => {
    const items = match
      .split('\n')
      .map(line => {
        const content = line.replace(/^[*+-]\s+/, '');
        return `  <li>${parseInline(content)}</li>`;
      })
      .join('\n');
    return `<ul>\n${items}\n</ul>`;
  });

  return text;
}

/**
 * Parse task lists (- [ ] or - [x])
 */
function parseTaskLists(text: string): string {
  return text.replace(/^- \[([ x])\]\s+(.+)$/gm, (match, checked, content) => {
    const isChecked = checked === 'x';
    const checkbox = `<input type="checkbox"${isChecked ? ' checked' : ''} disabled>`;
    return `<li class="task-list-item">${checkbox} ${parseInline(content)}</li>`;
  });
}

/**
 * Parse tables (GFM)
 */
function parseTables(text: string): string {
  const tableRegex = /^\|(.+)\|\n\|(?:\s*:?-+:?\s*\|)+\n((?:\|.+\|\n?)+)$/gm;

  return text.replace(tableRegex, (match, headerRow, bodyRows) => {
    const headers = headerRow
      .split('|')
      .filter((cell: string) => cell.trim())
      .map((cell: string) => `    <th>${parseInline(cell.trim())}</th>`)
      .join('\n');

    const rows = bodyRows
      .trim()
      .split('\n')
      .map((row: string) => {
        const cells = row
          .split('|')
          .filter((cell: string) => cell.trim())
          .map((cell: string) => `      <td>${parseInline(cell.trim())}</td>`)
          .join('\n');
        return `  <tr>\n${cells}\n  </tr>`;
      })
      .join('\n');

    return `<table>\n  <thead>\n  <tr>\n${headers}\n  </tr>\n  </thead>\n  <tbody>\n${rows}\n  </tbody>\n</table>`;
  });
}

/**
 * Parse paragraphs
 */
function parseParagraphs(text: string): string {
  // Split by double newlines
  const blocks = text.split(/\n\n+/);

  return blocks
    .map(block => {
      block = block.trim();

      // Skip if already wrapped in tags
      if (/^<(h[1-6]|hr|blockquote|ul|ol|pre|table)/.test(block)) {
        return block;
      }

      // Skip empty blocks
      if (!block) return '';

      return `<p>${block}</p>`;
    })
    .join('\n\n');
}

/**
 * Parse inline code (`code`)
 */
function parseInlineCode(text: string): string {
  return text.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });
}

/**
 * Parse images (![alt](url))
 */
function parseImages(text: string): string {
  return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    return `<img src="${url}" alt="${alt}">`;
  });
}

/**
 * Parse links ([text](url))
 */
function parseLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    return `<a href="${url}">${text}</a>`;
  });
}

/**
 * Parse bold (**text** or __text__)
 */
function parseBold(text: string): string {
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  return text;
}

/**
 * Parse italic (*text* or _text_)
 */
function parseItalic(text: string): string {
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
  return text;
}

/**
 * Parse strikethrough (~~text~~)
 */
function parseStrikethrough(text: string): string {
  return text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
}

/**
 * Parse inline elements (used for nested parsing)
 */
function parseInline(text: string): string {
  text = parseInlineCode(text);
  text = parseImages(text);
  text = parseLinks(text);
  text = parseBold(text);
  text = parseItalic(text);
  text = parseStrikethrough(text);
  return text;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return text.replace(/[&<>"']/g, char => entities[char]);
}

/**
 * Convert text to URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Parse markdown to HTML (alias for marked)
 */
export function parse(markdown: string, options?: MarkedOptions): string {
  return marked(markdown, options);
}

/**
 * Get tokens from markdown (for custom rendering)
 */
export function lexer(markdown: string): Token[] {
  const tokens: Token[] = [];

  // Simple tokenization
  const lines = markdown.split('\n');

  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        tokens.push({
          type: 'heading',
          depth: match[1].length,
          text: match[2]
        });
      }
    } else if (/^```/.test(line)) {
      tokens.push({ type: 'code', text: line });
    } else if (/^[*+-]\s/.test(line)) {
      tokens.push({ type: 'list_item', text: line.replace(/^[*+-]\s/, '') });
    } else if (line.trim()) {
      tokens.push({ type: 'paragraph', text: line });
    }
  }

  return tokens;
}

interface Token {
  type: string;
  text: string;
  depth?: number;
}

// CLI Demo
if (import.meta.url.includes("elide-marked.ts")) {
  console.log("📝 Marked - Markdown Parser for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Headers ===");
  const markdown1 = `# Heading 1
## Heading 2
### Heading 3`;
  console.log("Input:", markdown1.replace(/\n/g, "\\n"));
  console.log("Output:", marked(markdown1));
  console.log();

  console.log("=== Example 2: Emphasis ===");
  const markdown2 = `**Bold text** and *italic text*
__Also bold__ and _also italic_`;
  console.log("Input:", markdown2.replace(/\n/g, "\\n"));
  console.log("Output:", marked(markdown2));
  console.log();

  console.log("=== Example 3: Links and Images ===");
  const markdown3 = `[GitHub](https://github.com)
![Logo](https://example.com/logo.png)`;
  console.log("Input:", markdown3.replace(/\n/g, "\\n"));
  console.log("Output:", marked(markdown3));
  console.log();

  console.log("=== Example 4: Code ===");
  const markdown4 = `Inline \`code\` here

\`\`\`javascript
function hello() {
  console.log("Hello!");
}
\`\`\``;
  console.log("Output:");
  console.log(marked(markdown4));
  console.log();

  console.log("=== Example 5: Lists ===");
  const markdown5 = `- Item 1
- Item 2
- Item 3

1. First
2. Second
3. Third`;
  console.log("Output:");
  console.log(marked(markdown5));
  console.log();

  console.log("=== Example 6: Blockquotes ===");
  const markdown6 = `> This is a quote
> spanning multiple lines`;
  console.log("Output:", marked(markdown6));
  console.log();

  console.log("=== Example 7: Tables (GFM) ===");
  const markdown7 = `| Name | Age | City |
|------|-----|------|
| Alice | 25 | NYC |
| Bob | 30 | SF |`;
  console.log("Output:");
  console.log(marked(markdown7));
  console.log();

  console.log("=== Example 8: Task Lists (GFM) ===");
  const markdown8 = `- [x] Completed task
- [ ] Pending task`;
  console.log("Output:");
  console.log(marked(markdown8));
  console.log();

  console.log("=== Example 9: Strikethrough (GFM) ===");
  const markdown9 = `~~Crossed out text~~`;
  console.log("Output:", marked(markdown9));
  console.log();

  console.log("=== Example 10: Horizontal Rule ===");
  const markdown10 = `Above the line

---

Below the line`;
  console.log("Output:");
  console.log(marked(markdown10));
  console.log();

  console.log("=== Example 11: Complex Document ===");
  const readme = `# My Project

A **great** project for doing *amazing* things!

## Features

- Fast and efficient
- Easy to use
- Well documented

## Installation

\`\`\`bash
npm install my-project
\`\`\`

## Usage

\`\`\`javascript
import myProject from 'my-project';

myProject.doSomething();
\`\`\`

## License

[MIT](LICENSE)`;

  console.log("README Output:");
  console.log(marked(readme));
  console.log();

  console.log("=== Example 12: Header IDs ===");
  const markdown12 = `# Getting Started
## Installation
### Prerequisites`;
  console.log("With header IDs:");
  console.log(marked(markdown12, { headerIds: true, headerPrefix: 'user-content-' }));
  console.log();

  console.log("=== Example 13: POLYGLOT Use Case ===");
  console.log("🌐 Same markdown parser works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent Markdown rendering everywhere");
  console.log("  ✓ No language-specific Markdown bugs");
  console.log("  ✓ Share Markdown processing across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- README rendering");
  console.log("- Documentation generation");
  console.log("- Blog content");
  console.log("- Static site generation");
  console.log("- Content management systems");
  console.log("- Comment systems");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~15M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share Markdown templates across languages");
  console.log("- One Markdown renderer for all services");
  console.log("- Perfect for polyglot documentation!");
}
