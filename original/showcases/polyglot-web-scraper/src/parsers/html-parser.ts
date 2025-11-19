/**
 * HTML Parser - BeautifulSoup4 Wrapper for TypeScript
 *
 * Demonstrates Elide polyglot by wrapping Python's BeautifulSoup4 library
 * with TypeScript-friendly interfaces and methods.
 */

// @ts-ignore - Elide polyglot import: BeautifulSoup4
import bs4 from 'python:bs4';

// @ts-ignore - Elide polyglot import: regex support
import re from 'python:re';

// @ts-ignore - Elide polyglot import: CSS selector support
import cssselect from 'python:cssselect';

/**
 * HTML element interface
 */
export interface HTMLElement {
  tag: string;
  text: string;
  html: string;
  attrs: Record<string, string>;
  children: HTMLElement[];
}

/**
 * Parser options
 */
export interface ParserOptions {
  /** Parser to use: 'html.parser', 'lxml', 'html5lib' */
  parser?: 'html.parser' | 'lxml' | 'html5lib';

  /** Only parse specific elements (performance optimization) */
  parseOnly?: string[];

  /** Strip specific tags from output */
  stripTags?: string[];

  /** Preserve whitespace */
  preserveWhitespace?: boolean;

  /** Enable strict parsing (raise errors on malformed HTML) */
  strict?: boolean;
}

/**
 * HTML Parser class - TypeScript wrapper for BeautifulSoup4
 */
export class HTMLParser {
  private soup: any;
  private options: ParserOptions;

  /**
   * Initialize parser with HTML content
   */
  constructor(html: string, options: ParserOptions = {}) {
    this.options = {
      parser: 'html.parser',
      preserveWhitespace: false,
      strict: false,
      ...options
    };

    // Create BeautifulSoup parser
    if (this.options.parseOnly && this.options.parseOnly.length > 0) {
      // Use SoupStrainer for selective parsing
      const parseOnly = new bs4.SoupStrainer(this.options.parseOnly);
      this.soup = new bs4.BeautifulSoup(html, this.options.parser, { parse_only: parseOnly });
    } else {
      this.soup = new bs4.BeautifulSoup(html, this.options.parser);
    }

    // Strip unwanted tags if specified
    if (this.options.stripTags && this.options.stripTags.length > 0) {
      this.stripTags(this.options.stripTags);
    }
  }

  /**
   * Find first element matching selector
   */
  find(selector: string, attrs?: Record<string, any>): HTMLElement | null {
    try {
      const element = attrs ? this.soup.find(selector, attrs) : this.soup.find(selector);
      return element ? this.toElement(element) : null;
    } catch (error) {
      if (this.options.strict) throw error;
      return null;
    }
  }

  /**
   * Find all elements matching selector
   */
  findAll(selector: string, attrs?: Record<string, any>, limit?: number): HTMLElement[] {
    try {
      const elements = attrs
        ? this.soup.find_all(selector, attrs, { limit })
        : this.soup.find_all(selector, { limit });

      return elements.map((el: any) => this.toElement(el));
    } catch (error) {
      if (this.options.strict) throw error;
      return [];
    }
  }

  /**
   * Select elements using CSS selector
   */
  select(cssSelector: string, limit?: number): HTMLElement[] {
    try {
      const elements = this.soup.select(cssSelector, { limit });
      return elements.map((el: any) => this.toElement(el));
    } catch (error) {
      if (this.options.strict) throw error;
      return [];
    }
  }

  /**
   * Select first element using CSS selector
   */
  selectOne(cssSelector: string): HTMLElement | null {
    try {
      const element = this.soup.select_one(cssSelector);
      return element ? this.toElement(element) : null;
    } catch (error) {
      if (this.options.strict) throw error;
      return null;
    }
  }

  /**
   * Find elements by ID
   */
  findById(id: string): HTMLElement | null {
    return this.find({ id });
  }

  /**
   * Find elements by class name
   */
  findByClass(className: string, limit?: number): HTMLElement[] {
    return this.findAll({ class: className }, limit);
  }

  /**
   * Find elements by tag name
   */
  findByTag(tagName: string, limit?: number): HTMLElement[] {
    return this.findAll(tagName, undefined, limit);
  }

  /**
   * Find elements using regex pattern
   */
  findByPattern(pattern: string | RegExp, limit?: number): HTMLElement[] {
    const rePattern = typeof pattern === 'string' ? re.compile(pattern) : pattern;

    try {
      const elements = this.soup.find_all(text: rePattern, { limit });
      return elements.map((el: any) => this.toElement(el.parent));
    } catch (error) {
      if (this.options.strict) throw error;
      return [];
    }
  }

  /**
   * Get element text content
   */
  getText(separator: string = ' ', stripWhitespace: boolean = true): string {
    const text = this.soup.get_text(separator);
    return stripWhitespace ? text.strip() : text;
  }

  /**
   * Get all text nodes
   */
  getAllText(): string[] {
    return this.soup.stripped_strings ? Array.from(this.soup.stripped_strings) : [];
  }

  /**
   * Extract links from document
   */
  extractLinks(baseUrl?: string): Array<{ href: string; text: string; title?: string }> {
    const links = this.soup.find_all('a');

    return links.map((link: any) => {
      const href = link.get('href', '');
      return {
        href: baseUrl ? this.resolveUrl(baseUrl, href) : href,
        text: link.text?.strip() || '',
        title: link.get('title')
      };
    }).filter((link: any) => link.href);
  }

  /**
   * Extract images from document
   */
  extractImages(baseUrl?: string): Array<{
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
  }> {
    const images = this.soup.find_all('img');

    return images.map((img: any) => {
      const src = img.get('src', '');
      return {
        src: baseUrl ? this.resolveUrl(baseUrl, src) : src,
        alt: img.get('alt'),
        title: img.get('title'),
        width: img.get('width') ? parseInt(img.get('width')) : undefined,
        height: img.get('height') ? parseInt(img.get('height')) : undefined
      };
    }).filter((img: any) => img.src);
  }

  /**
   * Extract table data
   */
  extractTable(tableSelector?: string): {
    headers: string[];
    rows: string[][];
  } {
    const table = tableSelector ? this.soup.select_one(tableSelector) : this.soup.find('table');

    if (!table) {
      return { headers: [], rows: [] };
    }

    // Extract headers
    const headers: string[] = [];
    const headerRow = table.find('thead')?.find('tr') || table.find('tr');

    if (headerRow) {
      const headerCells = headerRow.find_all('th');
      for (const cell of headerCells) {
        headers.push(cell.text?.strip() || '');
      }
    }

    // Extract rows
    const rows: string[][] = [];
    const tbody = table.find('tbody') || table;
    const tableRows = tbody.find_all('tr');

    for (const row of tableRows) {
      const cells = row.find_all(['td', 'th']);
      if (cells.length > 0) {
        rows.push(cells.map((cell: any) => cell.text?.strip() || ''));
      }
    }

    return { headers, rows };
  }

  /**
   * Extract structured data based on schema
   */
  extractStructured(schema: Record<string, string | {
    selector: string;
    attribute?: string;
    transform?: (value: string) => any;
    multiple?: boolean;
    default?: any;
  }>): any {
    const result: any = {};

    for (const [key, config] of Object.entries(schema)) {
      try {
        if (typeof config === 'string') {
          // Simple CSS selector
          const element = this.soup.select_one(config);
          result[key] = element ? element.text?.strip() : null;
        } else {
          // Advanced configuration
          if (config.multiple) {
            const elements = this.soup.select(config.selector);
            result[key] = elements.map((el: any) => {
              let value = config.attribute ? el.get(config.attribute) : el.text?.strip();
              return config.transform ? config.transform(value) : value;
            });
          } else {
            const element = this.soup.select_one(config.selector);
            if (element) {
              let value = config.attribute ? element.get(config.attribute) : element.text?.strip();
              result[key] = config.transform ? config.transform(value) : value;
            } else {
              result[key] = config.default !== undefined ? config.default : null;
            }
          }
        }
      } catch (error) {
        result[key] = config.default !== undefined ? config.default : null;
      }
    }

    return result;
  }

  /**
   * Extract meta tags
   */
  extractMeta(): Record<string, string> {
    const meta: Record<string, string> = {};
    const metaTags = this.soup.find_all('meta');

    for (const tag of metaTags) {
      const name = tag.get('name') || tag.get('property');
      const content = tag.get('content');

      if (name && content) {
        meta[name] = content;
      }
    }

    return meta;
  }

  /**
   * Extract Open Graph data
   */
  extractOpenGraph(): Record<string, string> {
    const og: Record<string, string> = {};
    const ogTags = this.soup.find_all('meta', { property: re.compile('^og:') });

    for (const tag of ogTags) {
      const property = tag.get('property');
      const content = tag.get('content');

      if (property && content) {
        const key = property.replace('og:', '');
        og[key] = content;
      }
    }

    return og;
  }

  /**
   * Extract Twitter Card data
   */
  extractTwitterCard(): Record<string, string> {
    const twitter: Record<string, string> = {};
    const twitterTags = this.soup.find_all('meta', { name: re.compile('^twitter:') });

    for (const tag of twitterTags) {
      const name = tag.get('name');
      const content = tag.get('content');

      if (name && content) {
        const key = name.replace('twitter:', '');
        twitter[key] = content;
      }
    }

    return twitter;
  }

  /**
   * Extract JSON-LD structured data
   */
  extractJSONLD(): any[] {
    const scripts = this.soup.find_all('script', { type: 'application/ld+json' });
    const data: any[] = [];

    for (const script of scripts) {
      try {
        const json = JSON.parse(script.string);
        data.push(json);
      } catch (error) {
        // Skip invalid JSON
      }
    }

    return data;
  }

  /**
   * Extract forms with fields
   */
  extractForms(): Array<{
    action: string;
    method: string;
    fields: Array<{ name: string; type: string; value?: string; required: boolean }>;
  }> {
    const forms = this.soup.find_all('form');

    return forms.map((form: any) => {
      const fields: any[] = [];
      const inputs = form.find_all(['input', 'select', 'textarea']);

      for (const input of inputs) {
        fields.push({
          name: input.get('name'),
          type: input.get('type') || input.name,
          value: input.get('value'),
          required: input.has_attr('required')
        });
      }

      return {
        action: form.get('action', ''),
        method: form.get('method', 'GET').toUpperCase(),
        fields: fields.filter(f => f.name)
      };
    });
  }

  /**
   * Navigate to parent element
   */
  parent(element: HTMLElement): HTMLElement | null {
    const el = this.findElement(element);
    return el?.parent ? this.toElement(el.parent) : null;
  }

  /**
   * Navigate to next sibling
   */
  nextSibling(element: HTMLElement): HTMLElement | null {
    const el = this.findElement(element);
    const next = el?.find_next_sibling();
    return next ? this.toElement(next) : null;
  }

  /**
   * Navigate to previous sibling
   */
  previousSibling(element: HTMLElement): HTMLElement | null {
    const el = this.findElement(element);
    const prev = el?.find_previous_sibling();
    return prev ? this.toElement(prev) : null;
  }

  /**
   * Get all siblings
   */
  siblings(element: HTMLElement): HTMLElement[] {
    const el = this.findElement(element);
    if (!el) return [];

    const siblings = el.find_next_siblings();
    return siblings.map((sib: any) => this.toElement(sib));
  }

  /**
   * Get children elements
   */
  children(element: HTMLElement): HTMLElement[] {
    const el = this.findElement(element);
    if (!el) return [];

    const children = Array.from(el.children || []);
    return children
      .filter((child: any) => child.name) // Filter out text nodes
      .map((child: any) => this.toElement(child));
  }

  /**
   * Get descendants (all nested elements)
   */
  descendants(element: HTMLElement): HTMLElement[] {
    const el = this.findElement(element);
    if (!el) return [];

    const descendants = el.descendants;
    return Array.from(descendants || [])
      .filter((desc: any) => desc.name)
      .map((desc: any) => this.toElement(desc));
  }

  /**
   * Check if element matches selector
   */
  matches(element: HTMLElement, selector: string): boolean {
    const el = this.findElement(element);
    if (!el) return false;

    try {
      // Try CSS selector match
      const matches = el.select(selector);
      return matches.length > 0;
    } catch {
      // Try tag name match
      return el.name === selector;
    }
  }

  /**
   * Get attribute value
   */
  getAttribute(element: HTMLElement, name: string): string | null {
    const el = this.findElement(element);
    return el?.get(name) || null;
  }

  /**
   * Check if element has attribute
   */
  hasAttribute(element: HTMLElement, name: string): boolean {
    const el = this.findElement(element);
    return el?.has_attr(name) || false;
  }

  /**
   * Get all attributes
   */
  getAttributes(element: HTMLElement): Record<string, string> {
    const el = this.findElement(element);
    return el?.attrs || {};
  }

  /**
   * Get element HTML
   */
  getHTML(element?: HTMLElement): string {
    if (element) {
      const el = this.findElement(element);
      return el ? String(el) : '';
    }
    return this.soup.prettify();
  }

  /**
   * Pretty print HTML
   */
  prettify(): string {
    return this.soup.prettify();
  }

  /**
   * Remove elements matching selector
   */
  remove(selector: string): void {
    const elements = this.soup.select(selector);
    for (const el of elements) {
      el.decompose();
    }
  }

  /**
   * Strip specific tags
   */
  private stripTags(tags: string[]): void {
    for (const tag of tags) {
      const elements = this.soup.find_all(tag);
      for (const el of elements) {
        el.decompose();
      }
    }
  }

  /**
   * Convert BeautifulSoup element to HTMLElement interface
   */
  private toElement(el: any): HTMLElement {
    if (!el) {
      return {
        tag: '',
        text: '',
        html: '',
        attrs: {},
        children: []
      };
    }

    return {
      tag: el.name || '',
      text: el.text?.strip() || '',
      html: String(el),
      attrs: el.attrs || {},
      children: Array.from(el.children || [])
        .filter((child: any) => child.name)
        .map((child: any) => this.toElement(child))
    };
  }

  /**
   * Find BeautifulSoup element from HTMLElement
   */
  private findElement(element: HTMLElement): any {
    // This is a simplified version - in practice would need more robust matching
    const elements = this.soup.find_all(element.tag);
    for (const el of elements) {
      if (el.text?.strip() === element.text) {
        return el;
      }
    }
    return null;
  }

  /**
   * Resolve relative URL
   */
  private resolveUrl(base: string, relative: string): string {
    // Simple URL resolution - would use urllib.parse.urljoin in production
    if (relative.startsWith('http://') || relative.startsWith('https://')) {
      return relative;
    }

    if (relative.startsWith('//')) {
      const baseProtocol = base.split('://')[0];
      return `${baseProtocol}:${relative}`;
    }

    if (relative.startsWith('/')) {
      const baseUrl = new URL(base);
      return `${baseUrl.protocol}//${baseUrl.host}${relative}`;
    }

    return `${base.replace(/\/$/, '')}/${relative}`;
  }

  /**
   * Get raw BeautifulSoup object (for advanced usage)
   */
  getRaw(): any {
    return this.soup;
  }
}

/**
 * Utility functions for HTML parsing
 */
export class HTMLUtils {
  /**
   * Clean HTML text
   */
  static cleanText(text: string): string {
    // Remove extra whitespace
    let cleaned = text.replace(/\s+/g, ' ');
    cleaned = cleaned.trim();

    // Remove special characters
    cleaned = cleaned.replace(/[^\w\s\-.,!?:;'"]/g, '');

    return cleaned;
  }

  /**
   * Extract email addresses from text
   */
  static extractEmails(text: string): string[] {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailPattern) || [];
  }

  /**
   * Extract phone numbers from text
   */
  static extractPhones(text: string): string[] {
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    return text.match(phonePattern) || [];
  }

  /**
   * Extract URLs from text
   */
  static extractURLs(text: string): string[] {
    const urlPattern = /https?:\/\/[^\s]+/g;
    return text.match(urlPattern) || [];
  }

  /**
   * Remove HTML tags from string
   */
  static stripHTML(html: string): string {
    const parser = new HTMLParser(html);
    return parser.getText();
  }

  /**
   * Truncate text to specified length
   */
  static truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Detect language of text (basic detection)
   */
  static detectLanguage(text: string): string {
    // Very basic language detection - in production would use proper library
    const patterns: Record<string, RegExp> = {
      english: /\b(the|is|and|or|but|in|on|at)\b/i,
      spanish: /\b(el|la|los|las|de|en|y|o)\b/i,
      french: /\b(le|la|les|de|et|ou|dans)\b/i,
      german: /\b(der|die|das|und|oder|in|auf)\b/i
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'unknown';
  }

  /**
   * Calculate reading time (words per minute)
   */
  static calculateReadingTime(text: string, wpm: number = 200): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wpm);
  }

  /**
   * Extract word frequency
   */
  static wordFrequency(text: string, minLength: number = 3): Record<string, number> {
    const words = text.toLowerCase().split(/\s+/);
    const frequency: Record<string, number> = {};

    for (const word of words) {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length >= minLength) {
        frequency[cleaned] = (frequency[cleaned] || 0) + 1;
      }
    }

    return frequency;
  }
}

/**
 * HTML sanitizer
 */
export class HTMLSanitizer {
  private allowedTags: Set<string>;
  private allowedAttributes: Set<string>;

  constructor(options: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  } = {}) {
    this.allowedTags = new Set(options.allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ]);

    this.allowedAttributes = new Set(options.allowedAttributes || [
      'href', 'title', 'class', 'id'
    ]);
  }

  /**
   * Sanitize HTML by removing dangerous tags and attributes
   */
  sanitize(html: string): string {
    const parser = new HTMLParser(html);
    const soup = parser.getRaw();

    // Remove script and style tags
    for (const tag of soup.find_all(['script', 'style', 'iframe'])) {
      tag.decompose();
    }

    // Filter tags and attributes
    for (const tag of soup.find_all()) {
      if (!this.allowedTags.has(tag.name)) {
        tag.unwrap(); // Remove tag but keep content
      } else {
        // Filter attributes
        const attrs = tag.attrs || {};
        for (const attr of Object.keys(attrs)) {
          if (!this.allowedAttributes.has(attr)) {
            delete tag.attrs[attr];
          }
        }
      }
    }

    return String(soup);
  }
}

/**
 * Factory function to create HTML parser
 */
export function createHTMLParser(html: string, options?: ParserOptions): HTMLParser {
  return new HTMLParser(html, options);
}

export default HTMLParser;
