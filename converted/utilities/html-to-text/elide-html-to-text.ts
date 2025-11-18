/**
 * HTML to Text - Convert HTML to Plain Text
 *
 * Advanced HTML to plain text converter with formatting options.
 * **POLYGLOT SHOWCASE**: One HTML-to-text converter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/html-to-text (~8M downloads/week)
 *
 * Features:
 * - HTML to plain text
 * - Preserve formatting
 * - Link extraction
 * - Table conversion
 * - List formatting
 * - Customizable options
 *
 * Polyglot Benefits:
 * - Text extraction in any language
 * - ONE API for all services
 * - Share conversion logic
 * - Email compatibility
 *
 * Use cases:
 * - Email plain text versions
 * - Content extraction
 * - Search indexing
 * - Accessibility
 *
 * Package has ~8M downloads/week on npm!
 */

interface ConvertOptions {
  wordwrap?: number | false;
  preserveNewlines?: boolean;
  uppercaseHeadings?: boolean;
  singleNewLineParagraphs?: boolean;
  linkHrefBaseUrl?: string;
  hideLinkHrefIfSameAsText?: boolean;
  ignoreHref?: boolean;
  ignoreImage?: boolean;
  tables?: boolean | string[];
  unorderedListItemPrefix?: string;
}

class HtmlToText {
  private options: ConvertOptions;

  constructor(options: ConvertOptions = {}) {
    this.options = {
      wordwrap: 80,
      preserveNewlines: false,
      uppercaseHeadings: true,
      singleNewLineParagraphs: false,
      hideLinkHrefIfSameAsText: false,
      ignoreHref: false,
      ignoreImage: false,
      tables: true,
      unorderedListItemPrefix: ' * ',
      ...options
    };
  }

  convert(html: string): string {
    // Remove script and style tags
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    let text = '';

    // Convert headings
    text = this.convertHeadings(html);

    // Convert paragraphs
    text = this.convertParagraphs(text);

    // Convert line breaks
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Convert lists
    text = this.convertLists(text);

    // Convert links
    text = this.convertLinks(text);

    // Convert images
    if (!this.options.ignoreImage) {
      text = this.convertImages(text);
    }

    // Convert tables
    if (this.options.tables) {
      text = this.convertTables(text);
    }

    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    text = this.decodeEntities(text);

    // Clean up whitespace
    text = this.cleanupWhitespace(text);

    // Word wrap
    if (this.options.wordwrap) {
      text = this.wordWrap(text, this.options.wordwrap);
    }

    return text.trim();
  }

  private convertHeadings(html: string): string {
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`<h${i}[^>]*>(.*?)<\/h${i}>`, 'gi');
      html = html.replace(regex, (match, content) => {
        const text = this.options.uppercaseHeadings
          ? content.toUpperCase()
          : content;
        return '\n\n' + text + '\n' + '='.repeat(text.length) + '\n\n';
      });
    }
    return html;
  }

  private convertParagraphs(html: string): string {
    const newlines = this.options.singleNewLineParagraphs ? '\n' : '\n\n';
    return html.replace(/<p[^>]*>(.*?)<\/p>/gi, newlines + '$1' + newlines);
  }

  private convertLists(html: string): string {
    // Unordered lists
    html = html.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return '\n' + content + '\n';
    });

    html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, content) => {
      return this.options.unorderedListItemPrefix + content.trim() + '\n';
    });

    // Ordered lists
    let counter = 0;
    html = html.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      counter = 0;
      return '\n' + content + '\n';
    });

    html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, content) => {
      counter++;
      return ` ${counter}. ${content.trim()}\n`;
    });

    return html;
  }

  private convertLinks(html: string): string {
    if (this.options.ignoreHref) {
      return html.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
    }

    return html.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (match, href, text) => {
      if (this.options.hideLinkHrefIfSameAsText && href === text) {
        return text;
      }

      const fullHref = this.options.linkHrefBaseUrl
        ? new URL(href, this.options.linkHrefBaseUrl).href
        : href;

      return `${text} [${fullHref}]`;
    });
  }

  private convertImages(html: string): string {
    return html.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, '[$1]');
  }

  private convertTables(html: string): string {
    // Simple table conversion
    html = html.replace(/<table[^>]*>(.*?)<\/table>/gis, '\n$1\n');
    html = html.replace(/<tr[^>]*>(.*?)<\/tr>/gi, '$1\n');
    html = html.replace(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi, '$1\t');
    return html;
  }

  private decodeEntities(text: string): string {
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'"
    };

    for (const [entity, char] of Object.entries(entities)) {
      text = text.replace(new RegExp(entity, 'g'), char);
    }

    return text;
  }

  private cleanupWhitespace(text: string): string {
    // Remove excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim lines
    text = text.split('\n').map(line => line.trim()).join('\n');

    return text;
  }

  private wordWrap(text: string, width: number): string {
    const lines = text.split('\n');
    const wrapped: string[] = [];

    for (const line of lines) {
      if (line.length <= width) {
        wrapped.push(line);
      } else {
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          if ((currentLine + word).length <= width) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) wrapped.push(currentLine);
            currentLine = word;
          }
        }

        if (currentLine) wrapped.push(currentLine);
      }
    }

    return wrapped.join('\n');
  }
}

function convert(html: string, options?: ConvertOptions): string {
  const converter = new HtmlToText(options);
  return converter.convert(html);
}

export default convert;
export { convert, HtmlToText };
export type { ConvertOptions };

// CLI Demo
if (import.meta.url.includes("elide-html-to-text.ts")) {
  console.log("✅ HTML to Text - HTML Converter (POLYGLOT!)\n");

  const html = `
    <h1>Title</h1>
    <p>This is a <strong>paragraph</strong> with a <a href="https://example.com">link</a>.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  `;

  const text = convert(html);
  console.log("Converted text:");
  console.log(text);

  console.log("\n🚀 ~8M downloads/week on npm!");
  console.log("💡 Convert HTML to plain text!");
}
