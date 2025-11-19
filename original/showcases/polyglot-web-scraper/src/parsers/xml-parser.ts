/**
 * XML Parser - lxml Wrapper for TypeScript
 *
 * Demonstrates Elide polyglot by wrapping Python's lxml library
 * for powerful XML/HTML parsing with XPath support in TypeScript.
 */

// @ts-ignore - Elide polyglot import: lxml for XML parsing
import lxml from 'python:lxml';

// @ts-ignore - Elide polyglot import: lxml etree
import { etree } from 'python:lxml';

/**
 * XML Element interface
 */
export interface XMLElement {
  tag: string;
  text: string | null;
  tail: string | null;
  attributes: Record<string, string>;
  children: XMLElement[];
  prefix?: string;
  namespace?: string;
}

/**
 * XML Parser options
 */
export interface XMLParserOptions {
  /** Remove blank text nodes */
  removeBlankText?: boolean;

  /** Remove comments */
  removeComments?: boolean;

  /** Remove processing instructions */
  removePI?: boolean;

  /** Recover from errors (lenient parsing) */
  recover?: boolean;

  /** Enable huge tree parsing (for very large XML) */
  hugeTree?: boolean;

  /** Encoding of the XML document */
  encoding?: string;

  /** Validate against DTD */
  dtdValidation?: boolean;

  /** Validate against schema */
  schema?: any;
}

/**
 * XML Namespace map
 */
export type NamespaceMap = Record<string, string>;

/**
 * XML Parser class - TypeScript wrapper for lxml
 */
export class XMLParser {
  private tree: any;
  private root: any;
  private options: XMLParserOptions;

  /**
   * Initialize parser with XML content
   */
  constructor(xml: string | Buffer, options: XMLParserOptions = {}) {
    this.options = {
      removeBlankText: true,
      removeComments: false,
      removePI: false,
      recover: false,
      hugeTree: false,
      ...options
    };

    // Create parser with options
    const parserOptions: any = {};

    if (this.options.removeBlankText) {
      parserOptions.remove_blank_text = true;
    }

    if (this.options.removeComments) {
      parserOptions.remove_comments = true;
    }

    if (this.options.removePI) {
      parserOptions.remove_pis = true;
    }

    if (this.options.recover) {
      parserOptions.recover = true;
    }

    if (this.options.hugeTree) {
      parserOptions.huge_tree = true;
    }

    if (this.options.encoding) {
      parserOptions.encoding = this.options.encoding;
    }

    const parser = etree.XMLParser(parserOptions);

    // Parse XML
    if (typeof xml === 'string') {
      this.tree = etree.fromstring(xml, parser);
    } else {
      this.tree = etree.fromstring(xml.toString(), parser);
    }

    this.root = this.tree;
  }

  /**
   * XPath query - most powerful feature of lxml
   */
  xpath(query: string, namespaces?: NamespaceMap): XMLElement[] {
    try {
      const results = namespaces
        ? this.root.xpath(query, { namespaces })
        : this.root.xpath(query);

      if (!Array.isArray(results)) {
        return [this.toElement(results)];
      }

      return results.map((el: any) => this.toElement(el));
    } catch (error) {
      throw new Error(`XPath query failed: ${error}`);
    }
  }

  /**
   * XPath query returning single element
   */
  xpathOne(query: string, namespaces?: NamespaceMap): XMLElement | null {
    const results = this.xpath(query, namespaces);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * XPath query returning text
   */
  xpathText(query: string, namespaces?: NamespaceMap): string[] {
    try {
      const results = namespaces
        ? this.root.xpath(query, { namespaces })
        : this.root.xpath(query);

      if (!Array.isArray(results)) {
        return [String(results)];
      }

      return results.map((r: any) => String(r));
    } catch (error) {
      return [];
    }
  }

  /**
   * Find elements by tag name
   */
  findAll(tag: string, namespaces?: NamespaceMap): XMLElement[] {
    const query = namespaces ? this.buildNamespacedQuery(tag, namespaces) : `//${tag}`;
    return this.xpath(query, namespaces);
  }

  /**
   * Find first element by tag name
   */
  find(tag: string, namespaces?: NamespaceMap): XMLElement | null {
    const elements = this.findAll(tag, namespaces);
    return elements.length > 0 ? elements[0] : null;
  }

  /**
   * Find elements by attribute
   */
  findByAttribute(
    tag: string,
    attrName: string,
    attrValue?: string,
    namespaces?: NamespaceMap
  ): XMLElement[] {
    const query = attrValue
      ? `//${tag}[@${attrName}="${attrValue}"]`
      : `//${tag}[@${attrName}]`;

    return this.xpath(query, namespaces);
  }

  /**
   * Get element by ID
   */
  getElementById(id: string): XMLElement | null {
    return this.xpathOne(`//*[@id="${id}"]`);
  }

  /**
   * Get root element
   */
  getRoot(): XMLElement {
    return this.toElement(this.root);
  }

  /**
   * Get children of an element
   */
  getChildren(element: XMLElement, tag?: string): XMLElement[] {
    const el = this.findElementByPath(element);
    if (!el) return [];

    const children = tag ? el.findall(tag) : Array.from(el);
    return children.map((child: any) => this.toElement(child));
  }

  /**
   * Get parent of an element
   */
  getParent(element: XMLElement): XMLElement | null {
    const el = this.findElementByPath(element);
    if (!el) return null;

    const parent = el.getparent();
    return parent ? this.toElement(parent) : null;
  }

  /**
   * Get text content of element
   */
  getText(element: XMLElement, recursive: boolean = true): string {
    const el = this.findElementByPath(element);
    if (!el) return '';

    if (recursive) {
      // Get all text including descendants
      return etree.tostring(el, { method: 'text', encoding: 'unicode' });
    } else {
      // Get only direct text
      return el.text || '';
    }
  }

  /**
   * Get attribute value
   */
  getAttribute(element: XMLElement, name: string): string | null {
    return element.attributes[name] || null;
  }

  /**
   * Check if element has attribute
   */
  hasAttribute(element: XMLElement, name: string): boolean {
    return name in element.attributes;
  }

  /**
   * Extract all attributes matching pattern
   */
  extractAttributes(xpath: string, attrName: string, namespaces?: NamespaceMap): string[] {
    const elements = this.xpath(xpath, namespaces);
    return elements
      .map(el => this.getAttribute(el, attrName))
      .filter((val): val is string => val !== null);
  }

  /**
   * Extract structured data using XPath
   */
  extractStructured(schema: Record<string, string | {
    xpath: string;
    attribute?: string;
    transform?: (value: string) => any;
    multiple?: boolean;
    default?: any;
  }>, namespaces?: NamespaceMap): any {
    const result: any = {};

    for (const [key, config] of Object.entries(schema)) {
      try {
        if (typeof config === 'string') {
          // Simple XPath
          const value = this.xpathText(config, namespaces)[0];
          result[key] = value || null;
        } else {
          // Advanced configuration
          if (config.multiple) {
            if (config.attribute) {
              const values = this.extractAttributes(config.xpath, config.attribute, namespaces);
              result[key] = config.transform ? values.map(config.transform) : values;
            } else {
              const values = this.xpathText(config.xpath, namespaces);
              result[key] = config.transform ? values.map(config.transform) : values;
            }
          } else {
            let value: any;

            if (config.attribute) {
              const elements = this.xpath(config.xpath, namespaces);
              value = elements.length > 0 ? this.getAttribute(elements[0], config.attribute) : null;
            } else {
              const values = this.xpathText(config.xpath, namespaces);
              value = values.length > 0 ? values[0] : null;
            }

            result[key] = value !== null && config.transform
              ? config.transform(value)
              : (value !== null ? value : config.default);
          }
        }
      } catch (error) {
        result[key] = config.default !== undefined ? config.default : null;
      }
    }

    return result;
  }

  /**
   * Validate XML against XSD schema
   */
  validate(schemaXML: string): { valid: boolean; errors: string[] } {
    try {
      const schemaDoc = etree.fromstring(schemaXML);
      const schema = etree.XMLSchema(schemaDoc);

      const isValid = schema.validate(this.root);
      const errors = isValid ? [] : schema.error_log.map((e: any) => e.message);

      return { valid: isValid, errors };
    } catch (error) {
      return {
        valid: false,
        errors: [`Schema validation error: ${error}`]
      };
    }
  }

  /**
   * Convert to dictionary/object representation
   */
  toDict(): any {
    return this.elementToDict(this.root);
  }

  /**
   * Convert to JSON string
   */
  toJSON(pretty: boolean = false): string {
    const dict = this.toDict();
    return JSON.stringify(dict, null, pretty ? 2 : 0);
  }

  /**
   * Convert to XML string
   */
  toXML(pretty: boolean = false): string {
    return etree.tostring(
      this.root,
      {
        encoding: 'unicode',
        pretty_print: pretty
      }
    );
  }

  /**
   * Extract namespaces from document
   */
  getNamespaces(): NamespaceMap {
    const nsmap = this.root.nsmap || {};
    const namespaces: NamespaceMap = {};

    for (const [prefix, uri] of Object.entries(nsmap)) {
      if (prefix !== null) {
        namespaces[prefix] = String(uri);
      }
    }

    return namespaces;
  }

  /**
   * Count elements matching XPath
   */
  count(xpath: string, namespaces?: NamespaceMap): number {
    return this.xpath(xpath, namespaces).length;
  }

  /**
   * Check if element exists
   */
  exists(xpath: string, namespaces?: NamespaceMap): boolean {
    return this.count(xpath, namespaces) > 0;
  }

  /**
   * Get element path (absolute XPath)
   */
  getPath(element: XMLElement): string {
    const el = this.findElementByPath(element);
    if (!el) return '';

    return this.root.getpath(el);
  }

  /**
   * Iterate over elements matching XPath
   */
  *iterateXPath(xpath: string, namespaces?: NamespaceMap): IterableIterator<XMLElement> {
    const elements = this.xpath(xpath, namespaces);
    for (const element of elements) {
      yield element;
    }
  }

  /**
   * Convert lxml element to XMLElement interface
   */
  private toElement(el: any): XMLElement {
    if (!el || typeof el !== 'object') {
      return {
        tag: '',
        text: String(el),
        tail: null,
        attributes: {},
        children: []
      };
    }

    const element: XMLElement = {
      tag: el.tag || '',
      text: el.text || null,
      tail: el.tail || null,
      attributes: el.attrib || {},
      children: []
    };

    // Extract namespace and prefix
    if (element.tag.includes('}')) {
      const match = element.tag.match(/\{(.+)\}(.+)/);
      if (match) {
        element.namespace = match[1];
        element.tag = match[2];
        element.prefix = this.getPrefix(match[1]);
      }
    }

    // Get children
    try {
      const children = Array.from(el);
      element.children = children.map((child: any) => this.toElement(child));
    } catch {
      element.children = [];
    }

    return element;
  }

  /**
   * Convert element to dictionary
   */
  private elementToDict(el: any): any {
    const result: any = {
      tag: el.tag,
      attributes: el.attrib || {}
    };

    if (el.text && el.text.trim()) {
      result.text = el.text.trim();
    }

    const children = Array.from(el);
    if (children.length > 0) {
      result.children = children.map((child: any) => this.elementToDict(child));
    }

    return result;
  }

  /**
   * Find lxml element from XMLElement
   */
  private findElementByPath(element: XMLElement): any {
    // Simple implementation - would need more robust matching in production
    const xpath = `//${element.tag}`;
    const elements = this.root.xpath(xpath);

    for (const el of elements) {
      if (el.text === element.text) {
        return el;
      }
    }

    return null;
  }

  /**
   * Get namespace prefix
   */
  private getPrefix(uri: string): string | undefined {
    const namespaces = this.getNamespaces();
    for (const [prefix, nsUri] of Object.entries(namespaces)) {
      if (nsUri === uri) {
        return prefix;
      }
    }
    return undefined;
  }

  /**
   * Build namespaced XPath query
   */
  private buildNamespacedQuery(tag: string, namespaces: NamespaceMap): string {
    // If tag contains namespace prefix
    if (tag.includes(':')) {
      return `//${tag}`;
    }

    // Default namespace
    const defaultNS = namespaces[''] || namespaces['default'];
    if (defaultNS) {
      return `//*[local-name()='${tag}']`;
    }

    return `//${tag}`;
  }
}

/**
 * HTML Parser using lxml (faster than BeautifulSoup for well-formed HTML)
 */
export class LXMLHTMLParser {
  private tree: any;
  private root: any;

  constructor(html: string) {
    // Parse HTML using lxml's HTML parser
    const parser = etree.HTMLParser();
    this.tree = etree.fromstring(html, parser);
    this.root = this.tree;
  }

  /**
   * XPath query on HTML
   */
  xpath(query: string): XMLElement[] {
    const results = this.root.xpath(query);

    if (!Array.isArray(results)) {
      return [this.toElement(results)];
    }

    return results.map((el: any) => this.toElement(el));
  }

  /**
   * CSS selector (using cssselect)
   */
  cssSelect(selector: string): XMLElement[] {
    // lxml supports CSS selectors via cssselect
    const results = this.root.cssselect(selector);
    return results.map((el: any) => this.toElement(el));
  }

  /**
   * Convert to XMLElement
   */
  private toElement(el: any): XMLElement {
    return {
      tag: el.tag || '',
      text: el.text || null,
      tail: el.tail || null,
      attributes: el.attrib || {},
      children: []
    };
  }

  /**
   * Get HTML string
   */
  toHTML(): string {
    return etree.tostring(this.root, { method: 'html', encoding: 'unicode' });
  }
}

/**
 * XML Builder - construct XML documents programmatically
 */
export class XMLBuilder {
  private root: any;
  private current: any;

  constructor(rootTag: string, attributes?: Record<string, string>) {
    this.root = etree.Element(rootTag, attributes);
    this.current = this.root;
  }

  /**
   * Add child element
   */
  addElement(tag: string, text?: string, attributes?: Record<string, string>): XMLBuilder {
    const element = etree.SubElement(this.current, tag, attributes);

    if (text) {
      element.text = text;
    }

    return this;
  }

  /**
   * Enter element context (for nested elements)
   */
  enter(tag: string, attributes?: Record<string, string>): XMLBuilder {
    const element = etree.SubElement(this.current, tag, attributes);
    this.current = element;
    return this;
  }

  /**
   * Exit current element context
   */
  exit(): XMLBuilder {
    this.current = this.current.getparent() || this.root;
    return this;
  }

  /**
   * Add text to current element
   */
  text(text: string): XMLBuilder {
    this.current.text = text;
    return this;
  }

  /**
   * Add attribute to current element
   */
  attr(name: string, value: string): XMLBuilder {
    this.current.set(name, value);
    return this;
  }

  /**
   * Build and return XML string
   */
  build(pretty: boolean = false): string {
    return etree.tostring(this.root, {
      encoding: 'unicode',
      pretty_print: pretty
    });
  }

  /**
   * Get root element
   */
  getRoot(): any {
    return this.root;
  }
}

/**
 * XML Utilities
 */
export class XMLUtils {
  /**
   * Escape XML special characters
   */
  static escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Unescape XML entities
   */
  static unescape(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  /**
   * Validate XML well-formedness
   */
  static isWellFormed(xml: string): boolean {
    try {
      etree.fromstring(xml);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pretty print XML
   */
  static prettify(xml: string): string {
    const tree = etree.fromstring(xml);
    return etree.tostring(tree, {
      encoding: 'unicode',
      pretty_print: true
    });
  }

  /**
   * Minify XML (remove whitespace)
   */
  static minify(xml: string): string {
    const parser = etree.XMLParser({ remove_blank_text: true });
    const tree = etree.fromstring(xml, parser);
    return etree.tostring(tree, { encoding: 'unicode' });
  }

  /**
   * Compare two XML documents
   */
  static compare(xml1: string, xml2: string): boolean {
    try {
      const tree1 = etree.fromstring(xml1);
      const tree2 = etree.fromstring(xml2);

      // Simple comparison - in production would use more sophisticated method
      const str1 = etree.tostring(tree1, { encoding: 'unicode' });
      const str2 = etree.tostring(tree2, { encoding: 'unicode' });

      return str1 === str2;
    } catch {
      return false;
    }
  }
}

/**
 * Factory functions
 */
export function createXMLParser(xml: string, options?: XMLParserOptions): XMLParser {
  return new XMLParser(xml, options);
}

export function createHTMLParser(html: string): LXMLHTMLParser {
  return new LXMLHTMLParser(html);
}

export function createXMLBuilder(rootTag: string, attributes?: Record<string, string>): XMLBuilder {
  return new XMLBuilder(rootTag, attributes);
}

export default XMLParser;
