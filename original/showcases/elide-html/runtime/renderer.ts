/**
 * ElideHTML - Ultra-fast HTML Renderer
 *
 * Sub-millisecond template rendering optimized for htmx.
 * Zero build step, pure TypeScript templates.
 */

export interface RenderOptions {
  pretty?: boolean;
  stream?: boolean;
  cache?: boolean;
  cacheKey?: string;
  ttl?: number;
}

export interface HtmlNode {
  tag: string;
  attrs?: Record<string, string | boolean | number>;
  children?: (HtmlNode | string)[];
  void?: boolean;
}

/**
 * Core HTML renderer with sub-millisecond performance
 */
export class Renderer {
  private attrCache: Map<string, string> = new Map();
  private templateCache: Map<string, string> = new Map();

  /**
   * Render HTML nodes to string (optimized for speed)
   */
  render(node: HtmlNode | string, options: RenderOptions = {}): string {
    const startTime = performance.now();

    if (options.cache && options.cacheKey) {
      const cached = this.templateCache.get(options.cacheKey);
      if (cached) {
        return cached;
      }
    }

    const html = this.renderNode(node, options.pretty ? 0 : -1);

    if (options.cache && options.cacheKey) {
      this.templateCache.set(options.cacheKey, html);

      if (options.ttl) {
        setTimeout(() => {
          this.templateCache.delete(options.cacheKey!);
        }, options.ttl);
      }
    }

    const duration = performance.now() - startTime;
    console.log(`Rendered in ${duration.toFixed(3)}ms`);

    return html;
  }

  /**
   * Render a single node (recursive)
   */
  private renderNode(node: HtmlNode | string, indent: number): string {
    if (typeof node === 'string') {
      return this.escapeHtml(node);
    }

    const { tag, attrs, children, void: isVoid } = node;
    const indentStr = indent >= 0 ? '  '.repeat(indent) : '';
    const newline = indent >= 0 ? '\n' : '';

    let html = indentStr + '<' + tag;

    // Render attributes (cached for performance)
    if (attrs) {
      html += this.renderAttrs(attrs);
    }

    if (isVoid) {
      return html + '>' + newline;
    }

    html += '>';

    if (children && children.length > 0) {
      const hasComplexChildren = children.some(c => typeof c !== 'string');

      if (hasComplexChildren && indent >= 0) {
        html += newline;
        for (const child of children) {
          html += this.renderNode(child, indent + 1);
        }
        html += indentStr;
      } else {
        for (const child of children) {
          html += this.renderNode(child, -1);
        }
      }
    }

    html += '</' + tag + '>' + newline;
    return html;
  }

  /**
   * Render attributes (with caching)
   */
  private renderAttrs(attrs: Record<string, string | boolean | number>): string {
    const cacheKey = JSON.stringify(attrs);
    const cached = this.attrCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    let result = '';

    for (const [key, value] of Object.entries(attrs)) {
      if (value === false || value === null || value === undefined) {
        continue;
      }

      if (value === true) {
        result += ' ' + key;
      } else {
        result += ' ' + key + '="' + this.escapeAttr(String(value)) + '"';
      }
    }

    // Cache for future use (max 1000 entries)
    if (this.attrCache.size < 1000) {
      this.attrCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Escape HTML content
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Escape attribute values
   */
  private escapeAttr(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Stream rendering (for large documents)
   */
  async *renderStream(node: HtmlNode | string): AsyncGenerator<string> {
    if (typeof node === 'string') {
      yield this.escapeHtml(node);
      return;
    }

    const { tag, attrs, children, void: isVoid } = node;

    let html = '<' + tag;

    if (attrs) {
      html += this.renderAttrs(attrs);
    }

    if (isVoid) {
      yield html + '>';
      return;
    }

    yield html + '>';

    if (children && children.length > 0) {
      for (const child of children) {
        if (typeof child === 'string') {
          yield this.escapeHtml(child);
        } else {
          yield* this.renderStream(child);
        }
      }
    }

    yield '</' + tag + '>';
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.attrCache.clear();
    this.templateCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { attrCache: number; templateCache: number } {
    return {
      attrCache: this.attrCache.size,
      templateCache: this.templateCache.size,
    };
  }
}

/**
 * Helper functions for building HTML nodes
 */
export function h(
  tag: string,
  attrs?: Record<string, any> | null,
  ...children: (HtmlNode | string)[]
): HtmlNode {
  return {
    tag,
    attrs: attrs || undefined,
    children: children.length > 0 ? children.flat() : undefined,
  };
}

export function voidElement(tag: string, attrs?: Record<string, any>): HtmlNode {
  return {
    tag,
    attrs: attrs || undefined,
    void: true,
  };
}

/**
 * HTML builder functions
 */
export const html = {
  // Structure
  html: (attrs: any, ...children: any[]) => h('html', attrs, ...children),
  head: (attrs: any, ...children: any[]) => h('head', attrs, ...children),
  body: (attrs: any, ...children: any[]) => h('body', attrs, ...children),

  // Metadata
  title: (text: string) => h('title', null, text),
  meta: (attrs: any) => voidElement('meta', attrs),
  link: (attrs: any) => voidElement('link', attrs),
  script: (attrs: any, content?: string) => h('script', attrs, content || ''),

  // Sections
  div: (attrs: any, ...children: any[]) => h('div', attrs, ...children),
  section: (attrs: any, ...children: any[]) => h('section', attrs, ...children),
  article: (attrs: any, ...children: any[]) => h('article', attrs, ...children),
  header: (attrs: any, ...children: any[]) => h('header', attrs, ...children),
  footer: (attrs: any, ...children: any[]) => h('footer', attrs, ...children),
  nav: (attrs: any, ...children: any[]) => h('nav', attrs, ...children),
  main: (attrs: any, ...children: any[]) => h('main', attrs, ...children),

  // Text
  h1: (attrs: any, ...children: any[]) => h('h1', attrs, ...children),
  h2: (attrs: any, ...children: any[]) => h('h2', attrs, ...children),
  h3: (attrs: any, ...children: any[]) => h('h3', attrs, ...children),
  h4: (attrs: any, ...children: any[]) => h('h4', attrs, ...children),
  h5: (attrs: any, ...children: any[]) => h('h5', attrs, ...children),
  h6: (attrs: any, ...children: any[]) => h('h6', attrs, ...children),
  p: (attrs: any, ...children: any[]) => h('p', attrs, ...children),
  span: (attrs: any, ...children: any[]) => h('span', attrs, ...children),
  strong: (attrs: any, ...children: any[]) => h('strong', attrs, ...children),
  em: (attrs: any, ...children: any[]) => h('em', attrs, ...children),

  // Lists
  ul: (attrs: any, ...children: any[]) => h('ul', attrs, ...children),
  ol: (attrs: any, ...children: any[]) => h('ol', attrs, ...children),
  li: (attrs: any, ...children: any[]) => h('li', attrs, ...children),

  // Forms
  form: (attrs: any, ...children: any[]) => h('form', attrs, ...children),
  input: (attrs: any) => voidElement('input', attrs),
  textarea: (attrs: any, value?: string) => h('textarea', attrs, value || ''),
  select: (attrs: any, ...children: any[]) => h('select', attrs, ...children),
  option: (attrs: any, text: string) => h('option', attrs, text),
  button: (attrs: any, ...children: any[]) => h('button', attrs, ...children),
  label: (attrs: any, ...children: any[]) => h('label', attrs, ...children),

  // Tables
  table: (attrs: any, ...children: any[]) => h('table', attrs, ...children),
  thead: (attrs: any, ...children: any[]) => h('thead', attrs, ...children),
  tbody: (attrs: any, ...children: any[]) => h('tbody', attrs, ...children),
  tr: (attrs: any, ...children: any[]) => h('tr', attrs, ...children),
  th: (attrs: any, ...children: any[]) => h('th', attrs, ...children),
  td: (attrs: any, ...children: any[]) => h('td', attrs, ...children),

  // Media
  img: (attrs: any) => voidElement('img', attrs),
  a: (attrs: any, ...children: any[]) => h('a', attrs, ...children),

  // Other
  br: () => voidElement('br'),
  hr: () => voidElement('hr'),
};

// Create singleton instance
export const renderer = new Renderer();

/**
 * Quick render function
 */
export function render(node: HtmlNode | string, options?: RenderOptions): string {
  return renderer.render(node, options);
}
