/**
 * Elide Cheerio - Universal HTML Parser
 *
 * Fast, flexible HTML parsing and manipulation across all languages.
 * jQuery-like API for server-side HTML processing.
 */

export interface CheerioOptions {
  xml?: boolean;
  decodeEntities?: boolean;
}

export interface CheerioElement {
  type: 'tag' | 'text' | 'comment';
  name?: string;
  attribs?: Record<string, string>;
  children?: CheerioElement[];
  data?: string;
  parent?: CheerioElement;
}

export class CheerioAPI {
  private root: CheerioElement;

  constructor(html: string, options: CheerioOptions = {}) {
    this.root = this.parse(html, options);
  }

  // Simple HTML parser
  private parse(html: string, options: CheerioOptions): CheerioElement {
    const tagRegex = /<(\/?)([\w-]+)([^>]*)>/g;
    const stack: CheerioElement[] = [];
    const root: CheerioElement = { type: 'tag', name: 'root', children: [], attribs: {} };
    let current = root;
    let lastIndex = 0;

    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      // Add text before tag
      const text = html.substring(lastIndex, match.index).trim();
      if (text) {
        current.children!.push({ type: 'text', data: text, parent: current });
      }

      const [fullMatch, isClosing, tagName, attributes] = match;
      lastIndex = match.index + fullMatch.length;

      if (isClosing) {
        // Closing tag
        if (stack.length > 0) {
          current = stack.pop()!;
        }
      } else {
        // Opening tag
        const element: CheerioElement = {
          type: 'tag',
          name: tagName.toLowerCase(),
          attribs: this.parseAttributes(attributes),
          children: [],
          parent: current
        };

        current.children!.push(element);

        // Self-closing tags
        const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
        if (!selfClosing.includes(tagName.toLowerCase()) && !attributes.includes('/')) {
          stack.push(current);
          current = element;
        }
      }
    }

    // Add remaining text
    const remainingText = html.substring(lastIndex).trim();
    if (remainingText) {
      current.children!.push({ type: 'text', data: remainingText, parent: current });
    }

    return root;
  }

  // Parse HTML attributes
  private parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrRegex = /([\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]*))?/g;

    let match;
    while ((match = attrRegex.exec(attrString)) !== null) {
      const [, name, val1, val2, val3] = match;
      attrs[name] = val1 || val2 || val3 || '';
    }

    return attrs;
  }

  // Find elements by selector
  find(selector: string): CheerioElement[] {
    // Simple selector support (tag, .class, #id)
    const results: CheerioElement[] = [];

    const findInElement = (el: CheerioElement) => {
      if (el.type !== 'tag') return;

      // Tag selector
      if (!selector.startsWith('.') && !selector.startsWith('#')) {
        if (el.name === selector) {
          results.push(el);
        }
      }

      // Class selector
      if (selector.startsWith('.')) {
        const className = selector.substring(1);
        if (el.attribs?.class?.split(' ').includes(className)) {
          results.push(el);
        }
      }

      // ID selector
      if (selector.startsWith('#')) {
        const id = selector.substring(1);
        if (el.attribs?.id === id) {
          results.push(el);
        }
      }

      el.children?.forEach(findInElement);
    };

    findInElement(this.root);
    return results;
  }

  // Get text content
  text(elements?: CheerioElement[]): string {
    const els = elements || [this.root];
    let text = '';

    const getText = (el: CheerioElement) => {
      if (el.type === 'text') {
        text += el.data;
      }
      el.children?.forEach(getText);
    };

    els.forEach(getText);
    return text.trim();
  }

  // Get HTML content
  html(elements?: CheerioElement[]): string {
    const els = elements || [this.root];
    return els.map(el => this.elementToHtml(el)).join('');
  }

  // Convert element to HTML
  private elementToHtml(el: CheerioElement): string {
    if (el.type === 'text') {
      return el.data || '';
    }

    if (el.type !== 'tag' || !el.name) {
      return '';
    }

    const attrs = Object.entries(el.attribs || {})
      .map(([key, value]) => ` ${key}="${value}"`)
      .join('');

    const childrenHtml = (el.children || []).map(child => this.elementToHtml(child)).join('');

    const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    if (selfClosing.includes(el.name)) {
      return `<${el.name}${attrs}/>`;
    }

    return `<${el.name}${attrs}>${childrenHtml}</${el.name}>`;
  }

  // Get attribute
  attr(elements: CheerioElement[], name: string): string | undefined {
    return elements[0]?.attribs?.[name];
  }
}

// Factory function
export function load(html: string, options?: CheerioOptions): any {
  const api = new CheerioAPI(html, options);

  // Create chainable API
  const $ = (selector: string) => {
    const elements = api.find(selector);
    return {
      text: () => api.text(elements),
      html: () => api.html(elements),
      attr: (name: string) => api.attr(elements, name),
      length: elements.length,
      get: (index: number) => elements[index]
    };
  };

  $.root = () => ({
    text: () => api.text(),
    html: () => api.html()
  });

  return $;
}

// Export default
export default { load };

// Demo
if (import.meta.main) {
  console.log('=== Elide Cheerio Demo ===\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1 id="main-title" class="header">Welcome</h1>
        <div class="content">
          <p class="intro">This is a test.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </div>
        <a href="https://example.com" class="link">Link</a>
        <img src="/image.jpg" alt="Image"/>
      </body>
    </html>
  `;

  // Example 1: Load HTML
  console.log('1. Load HTML and find title:');
  const $ = load(html);
  console.log('   Title:', $('title').text());
  console.log('');

  // Example 2: Find by ID
  console.log('2. Find by ID:');
  const title = $('#main-title').text();
  console.log('   Main title:', title);
  console.log('');

  // Example 3: Find by class
  console.log('3. Find by class:');
  const intro = $('.intro').text();
  console.log('   Intro text:', intro);
  console.log('');

  // Example 4: Find all list items
  console.log('4. Find all list items:');
  const items = $('li');
  console.log('   Number of items:', items.length);
  console.log('   First item:', items.get(0));
  console.log('');

  // Example 5: Get attributes
  console.log('5. Get attributes:');
  const link = $('a');
  console.log('   Link href:', link.attr('href'));
  console.log('   Link text:', link.text());
  console.log('');

  // Example 6: Get HTML
  console.log('6. Get HTML:');
  const contentHtml = $('.content').html();
  console.log('   Content HTML:', contentHtml.substring(0, 100) + '...');
  console.log('');

  // Example 7: Extract all text
  console.log('7. Extract all text from body:');
  const allText = $.root().text();
  console.log('   All text:', allText.substring(0, 80) + '...');
  console.log('');

  console.log('✓ All examples completed successfully!');
  console.log('\nNote: This is a simplified HTML parser.');
  console.log('For complex HTML, consider using a full parser.');
}
