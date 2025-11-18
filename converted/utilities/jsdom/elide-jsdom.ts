/**
 * JSDOM - JavaScript DOM Implementation for Elide
 * NPM: 40M+ downloads/week
 */

class DOMElement {
  tagName: string;
  textContent: string = '';
  children: DOMElement[] = [];
  attributes: Map<string, string> = new Map();

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) || null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  querySelector(selector: string): DOMElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.getAttribute('id') === id) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }
}

class DOMDocument {
  body: DOMElement;

  constructor() {
    this.body = new DOMElement('BODY');
  }

  querySelector(selector: string): DOMElement | null {
    return this.body.querySelector(selector);
  }
}

export class JSDOM {
  window: { document: DOMDocument };

  constructor(html: string) {
    const document = new DOMDocument();
    this.parseHTML(html, document.body);
    this.window = { document };
  }

  private parseHTML(html: string, parent: DOMElement): void {
    const tagPattern = /<(\w+)([^>]*)>(.*?)<\/\1>/gs;
    let match;

    while ((match = tagPattern.exec(html)) !== null) {
      const [, tagName, attrs, content] = match;
      const element = new DOMElement(tagName);

      // Parse attributes
      const attrPattern = /(\w+)="([^"]*)"/g;
      let attrMatch;
      while ((attrMatch = attrPattern.exec(attrs)) !== null) {
        element.setAttribute(attrMatch[1], attrMatch[2]);
      }

      // Set text content
      if (!content.includes('<')) {
        element.textContent = content.trim();
      } else {
        this.parseHTML(content, element);
      }

      parent.children.push(element);
    }
  }
}

if (import.meta.url.includes("jsdom")) {
  console.log("🎯 JSDOM for Elide - DOM Implementation\n");
  const html = '<div id="main"><h1>Hello World</h1></div>';
  const dom = new JSDOM(html);
  const el = dom.window.document.querySelector('#main');
  console.log("Found element:", el?.tagName, "ID:", el?.getAttribute('id'));
}

export default JSDOM;
