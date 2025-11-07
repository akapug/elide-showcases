/**
 * CMS Platform - Markdown Engine
 *
 * Processes markdown content using the marked conversion library.
 * Provides sanitization, syntax highlighting, and custom extensions.
 */

/**
 * Markdown rendering options
 */
interface MarkdownOptions {
  sanitize: boolean;
  breaks: boolean;
  gfm: boolean;
  headerIds: boolean;
  mangle: boolean;
  smartLists: boolean;
  smartypants: boolean;
  xhtml: boolean;
  highlight?: (code: string, lang: string) => string;
}

/**
 * Table of contents item
 */
interface TocItem {
  level: number;
  text: string;
  id: string;
  children: TocItem[];
}

/**
 * Markdown statistics
 */
interface MarkdownStats {
  wordCount: number;
  characterCount: number;
  readingTime: number;
  headingCount: number;
  linkCount: number;
  imageCount: number;
  codeBlockCount: number;
}

/**
 * Markdown Engine
 */
export class MarkdownEngine {
  private options: MarkdownOptions;
  private customRenderers: Map<string, (tokens: any) => string> = new Map();

  constructor(options: Partial<MarkdownOptions> = {}) {
    this.options = {
      sanitize: true,
      breaks: true,
      gfm: true,
      headerIds: true,
      mangle: false,
      smartLists: true,
      smartypants: true,
      xhtml: false,
      ...options
    };

    this.setupCustomRenderers();
  }

  /**
   * Render markdown to HTML
   */
  render(markdown: string): string {
    if (!markdown) {
      return '';
    }

    try {
      // Parse markdown tokens
      const tokens = this.parseMarkdown(markdown);

      // Render tokens to HTML
      let html = this.renderTokens(tokens);

      // Sanitize if needed
      if (this.options.sanitize) {
        html = this.sanitizeHtml(html);
      }

      // Apply post-processing
      html = this.postProcess(html);

      return html;
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return this.escapeHtml(markdown);
    }
  }

  /**
   * Render markdown with table of contents
   */
  renderWithToc(markdown: string): { html: string; toc: TocItem[] } {
    const html = this.render(markdown);
    const toc = this.generateToc(markdown);

    return { html, toc };
  }

  /**
   * Parse markdown into tokens
   */
  private parseMarkdown(markdown: string): any[] {
    const tokens: any[] = [];
    const lines = markdown.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        tokens.push({
          type: 'heading',
          depth: headingMatch[1].length,
          text: headingMatch[2]
        });
        i++;
        continue;
      }

      // Code block
      if (line.startsWith('```')) {
        const lang = line.substring(3).trim();
        const codeLines: string[] = [];
        i++;

        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }

        tokens.push({
          type: 'code',
          lang,
          text: codeLines.join('\n')
        });
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        const quoteLines: string[] = [line.substring(2)];
        i++;

        while (i < lines.length && lines[i].startsWith('> ')) {
          quoteLines.push(lines[i].substring(2));
          i++;
        }

        tokens.push({
          type: 'blockquote',
          text: quoteLines.join('\n')
        });
        continue;
      }

      // List
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const items: string[] = [listMatch[3]];
        const ordered = /^\d+\./.test(listMatch[2]);
        i++;

        while (i < lines.length) {
          const itemMatch = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
          if (!itemMatch) break;
          items.push(itemMatch[3]);
          i++;
        }

        tokens.push({
          type: 'list',
          ordered,
          items
        });
        continue;
      }

      // Horizontal rule
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        tokens.push({ type: 'hr' });
        i++;
        continue;
      }

      // Paragraph
      if (line.trim()) {
        tokens.push({
          type: 'paragraph',
          text: line
        });
      }

      i++;
    }

    return tokens;
  }

  /**
   * Render tokens to HTML
   */
  private renderTokens(tokens: any[]): string {
    return tokens.map(token => this.renderToken(token)).join('\n');
  }

  /**
   * Render single token
   */
  private renderToken(token: any): string {
    switch (token.type) {
      case 'heading':
        return this.renderHeading(token);

      case 'paragraph':
        return this.renderParagraph(token);

      case 'code':
        return this.renderCodeBlock(token);

      case 'blockquote':
        return this.renderBlockquote(token);

      case 'list':
        return this.renderList(token);

      case 'hr':
        return '<hr />';

      default:
        return '';
    }
  }

  /**
   * Render heading
   */
  private renderHeading(token: any): string {
    const { depth, text } = token;
    const id = this.options.headerIds ? this.generateId(text) : '';
    const idAttr = id ? ` id="${id}"` : '';

    const inlineHtml = this.renderInline(text);

    return `<h${depth}${idAttr}>${inlineHtml}</h${depth}>`;
  }

  /**
   * Render paragraph
   */
  private renderParagraph(token: any): string {
    const inlineHtml = this.renderInline(token.text);
    return `<p>${inlineHtml}</p>`;
  }

  /**
   * Render code block
   */
  private renderCodeBlock(token: any): string {
    const { lang, text } = token;
    const langClass = lang ? ` class="language-${lang}"` : '';

    let code = this.escapeHtml(text);

    // Apply syntax highlighting if available
    if (this.options.highlight && lang) {
      code = this.options.highlight(text, lang);
    }

    return `<pre><code${langClass}>${code}</code></pre>`;
  }

  /**
   * Render blockquote
   */
  private renderBlockquote(token: any): string {
    const content = this.renderInline(token.text);
    return `<blockquote>${content}</blockquote>`;
  }

  /**
   * Render list
   */
  private renderList(token: any): string {
    const { ordered, items } = token;
    const tag = ordered ? 'ol' : 'ul';

    const itemsHtml = items
      .map((item: string) => `<li>${this.renderInline(item)}</li>`)
      .join('\n');

    return `<${tag}>\n${itemsHtml}\n</${tag}>`;
  }

  /**
   * Render inline elements
   */
  private renderInline(text: string): string {
    let html = text;

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const safeUrl = this.sanitizeUrl(url);
      return `<a href="${safeUrl}">${this.escapeHtml(text)}</a>`;
    });

    // Images: ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      const safeUrl = this.sanitizeUrl(url);
      const safeAlt = this.escapeHtml(alt);
      return `<img src="${safeUrl}" alt="${safeAlt}" />`;
    });

    // Bold: **text** or __text__
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      return `<code>${this.escapeHtml(code)}</code>`;
    });

    // Strikethrough: ~~text~~
    if (this.options.gfm) {
      html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    }

    // Line breaks
    if (this.options.breaks) {
      html = html.replace(/\n/g, '<br />');
    }

    return html;
  }

  /**
   * Generate table of contents
   */
  private generateToc(markdown: string): TocItem[] {
    const headings: TocItem[] = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = this.generateId(text);

        headings.push({
          level,
          text,
          id,
          children: []
        });
      }
    }

    // Build hierarchy
    return this.buildTocHierarchy(headings);
  }

  /**
   * Build TOC hierarchy
   */
  private buildTocHierarchy(items: TocItem[]): TocItem[] {
    const root: TocItem[] = [];
    const stack: TocItem[] = [];

    for (const item of items) {
      // Remove items from stack that are at same or higher level
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }

      stack.push(item);
    }

    return root;
  }

  /**
   * Calculate markdown statistics
   */
  getStats(markdown: string): MarkdownStats {
    const words = markdown.trim().split(/\s+/).filter(w => w.length > 0);
    const characters = markdown.length;
    const readingTime = Math.ceil(words.length / 200); // 200 WPM

    const headings = (markdown.match(/^#{1,6}\s+.+$/gm) || []).length;
    const links = (markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const images = (markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;
    const codeBlocks = (markdown.match(/```/g) || []).length / 2;

    return {
      wordCount: words.length,
      characterCount: characters,
      readingTime,
      headingCount: headings,
      linkCount: links,
      imageCount: images,
      codeBlockCount: Math.floor(codeBlocks)
    };
  }

  /**
   * Setup custom renderers
   */
  private setupCustomRenderers(): void {
    // Custom renderers can be registered here for extending markdown functionality
  }

  /**
   * Post-process HTML
   */
  private postProcess(html: string): string {
    // Add target="_blank" to external links
    html = html.replace(
      /<a href="(https?:\/\/[^"]+)"/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer"'
    );

    // Add loading="lazy" to images
    html = html.replace(/<img /g, '<img loading="lazy" ');

    return html;
  }

  /**
   * Sanitize HTML
   */
  private sanitizeHtml(html: string): string {
    // Remove potentially dangerous tags and attributes
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form'];
    const dangerousAttrs = ['onerror', 'onclick', 'onload'];

    let sanitized = html;

    // Remove dangerous tags
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // Remove dangerous attributes
    dangerousAttrs.forEach(attr => {
      const regex = new RegExp(`\\s${attr}="[^"]*"`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    return sanitized;
  }

  /**
   * Sanitize URL
   */
  private sanitizeUrl(url: string): string {
    // Remove javascript: and data: URLs
    if (/^(javascript|data):/i.test(url)) {
      return '';
    }

    return this.escapeHtml(url);
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
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
   * Generate ID from text
   */
  private generateId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Register custom renderer
   */
  registerRenderer(type: string, renderer: (tokens: any) => string): void {
    this.customRenderers.set(type, renderer);
  }
}

// Export singleton instance with default configuration
export const markdownEngine = new MarkdownEngine({
  sanitize: true,
  breaks: true,
  gfm: true
});

/**
 * Convenience function for rendering markdown
 */
export function renderMarkdown(markdown: string): string {
  return markdownEngine.render(markdown);
}

/**
 * Convenience function for rendering with TOC
 */
export function renderMarkdownWithToc(markdown: string): { html: string; toc: TocItem[] } {
  return markdownEngine.renderWithToc(markdown);
}

/**
 * Get markdown statistics
 */
export function getMarkdownStats(markdown: string): MarkdownStats {
  return markdownEngine.getStats(markdown);
}
