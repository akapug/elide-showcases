/**
 * HTML DOM Parser - Convert HTML to DOM Nodes
 *
 * Converts HTML strings to DOM nodes.
 * **POLYGLOT SHOWCASE**: One HTML-to-DOM converter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/html-dom-parser (~5M downloads/week)
 *
 * Features:
 * - HTML string parsing
 * - DOM node creation
 * - Fast conversion
 * - Browser and Node.js support
 * - TypeScript support
 * - Lightweight
 *
 * Polyglot Benefits:
 * - HTML parsing in any language
 * - ONE API for all services
 * - Share parsing logic
 * - Consistent behavior
 *
 * Use cases:
 * - HTML to DOM conversion
 * - Template rendering
 * - SSR support
 * - Content parsing
 *
 * Package has ~5M downloads/week on npm!
 */

interface DOMNode {
  type: 'tag' | 'text' | 'comment';
  name?: string;
  data?: string;
  attribs?: Record<string, string>;
  children?: DOMNode[];
}

function parse(html: string): DOMNode[] {
  const nodes: DOMNode[] = [];

  // Simplified HTML parsing
  const tagRegex = /<(\w+)([^>]*)>(.*?)<\/\1>|<!--(.*?)-->|([^<]+)/gs;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match[1]) {
      // Element tag
      const node: DOMNode = {
        type: 'tag',
        name: match[1],
        attribs: parseAttributes(match[2]),
        children: parse(match[3])
      };
      nodes.push(node);
    } else if (match[4]) {
      // Comment
      nodes.push({
        type: 'comment',
        data: match[4]
      });
    } else if (match[5]) {
      // Text node
      const text = match[5].trim();
      if (text) {
        nodes.push({
          type: 'text',
          data: text
        });
      }
    }
  }

  return nodes;
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let match;

  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

function attributesToProps(node: DOMNode): any {
  if (node.type !== 'tag' || !node.attribs) {
    return {};
  }

  const props: any = {};

  for (const [key, value] of Object.entries(node.attribs)) {
    // Convert attribute names to camelCase for React
    const propName = key === 'class' ? 'className' : key;
    props[propName] = value;
  }

  return props;
}

function domToReact(nodes: DOMNode[]): any[] {
  return nodes.map(node => {
    if (node.type === 'text') {
      return node.data;
    }

    if (node.type === 'tag') {
      return {
        type: node.name,
        props: attributesToProps(node),
        children: node.children ? domToReact(node.children) : []
      };
    }

    return null;
  }).filter(Boolean);
}

export default parse;
export { parse, parseAttributes, attributesToProps, domToReact };
export type { DOMNode };

// CLI Demo
if (import.meta.url.includes("elide-html-dom-parser.ts")) {
  console.log("✅ HTML DOM Parser - HTML to DOM (POLYGLOT!)\n");

  const html = '<div class="container"><h1>Hello</h1><p>World</p></div>';
  const nodes = parse(html);

  console.log("Parsed nodes:");
  console.log("  Node count:", nodes.length);
  console.log("  First node:", nodes[0]?.name);

  console.log("\n🚀 ~5M downloads/week on npm!");
  console.log("💡 Convert HTML strings to DOM nodes!");
}
