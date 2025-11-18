/**
 * parse5 - HTML Parser for Elide
 * NPM: 50M+ downloads/week
 */

export interface Node {
  nodeName: string;
  tagName?: string;
  value?: string;
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: Node[];
}

export function parse(html: string): Node {
  const root: Node = {
    nodeName: '#document',
    childNodes: []
  };

  parseHTML(html, root);
  return root;
}

function parseHTML(html: string, parent: Node): void {
  const tagPattern = /<(\w+)([^>]*)>(.*?)<\/\1>/gs;
  const selfClosingPattern = /<(\w+)([^>]*?)\/>/g;
  let match;

  // Parse regular tags
  html = html.replace(tagPattern, (fullMatch, tagName, attrs, content) => {
    const node: Node = {
      nodeName: tagName.toUpperCase(),
      tagName: tagName,
      attrs: parseAttributes(attrs),
      childNodes: []
    };

    if (content.trim() && !content.includes('<')) {
      // Text node
      node.childNodes!.push({
        nodeName: '#text',
        value: content.trim()
      });
    } else if (content.includes('<')) {
      // Nested elements
      parseHTML(content, node);
    }

    if (!parent.childNodes) parent.childNodes = [];
    parent.childNodes.push(node);

    return '';
  });

  // Parse self-closing tags
  html.replace(selfClosingPattern, (_, tagName, attrs) => {
    const node: Node = {
      nodeName: tagName.toUpperCase(),
      tagName: tagName,
      attrs: parseAttributes(attrs)
    };

    if (!parent.childNodes) parent.childNodes = [];
    parent.childNodes.push(node);

    return '';
  });
}

function parseAttributes(attrString: string): Array<{ name: string; value: string }> {
  const attrs: Array<{ name: string; value: string }> = [];
  const attrPattern = /(\w+)="([^"]*)"/g;
  let match;

  while ((match = attrPattern.exec(attrString)) !== null) {
    attrs.push({ name: match[1], value: match[2] });
  }

  return attrs;
}

export function serialize(node: Node): string {
  if (node.nodeName === '#text') {
    return node.value || '';
  }

  if (node.nodeName === '#document') {
    return (node.childNodes || []).map(serialize).join('');
  }

  const tagName = node.tagName;
  const attrs = (node.attrs || [])
    .map(attr => `${attr.name}="${attr.value}"`)
    .join(' ');

  const attrStr = attrs ? ` ${attrs}` : '';
  const children = (node.childNodes || []).map(serialize).join('');

  if (!children) {
    return `<${tagName}${attrStr} />`;
  }

  return `<${tagName}${attrStr}>${children}</${tagName}>`;
}

if (import.meta.url.includes("parse5")) {
  console.log("🎯 parse5 for Elide - HTML Parser\n");
  const html = '<div id="main"><h1>Hello</h1></div>';
  const doc = parse(html);
  console.log("Parsed:", JSON.stringify(doc, null, 2));
  console.log("\nSerialized:", serialize(doc));
}

export default { parse, serialize };
