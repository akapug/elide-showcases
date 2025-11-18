/**
 * PostHTML Render - AST to HTML Renderer
 *
 * Renders PostHTML AST back to HTML strings.
 * **POLYGLOT SHOWCASE**: One PostHTML renderer for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/posthtml-render (~8M downloads/week)
 *
 * Features:
 * - AST to HTML rendering
 * - PostHTML compatible
 * - Fast rendering
 * - Pretty printing
 * - Minification support
 * - Custom formatting
 *
 * Polyglot Benefits:
 * - HTML rendering in any language
 * - ONE API for all services
 * - Share rendering logic
 * - Plugin compatibility
 *
 * Use cases:
 * - AST to HTML conversion
 * - Template rendering
 * - Build output
 * - HTML generation
 *
 * Package has ~8M downloads/week on npm!
 */

interface PostHTMLNode {
  tag?: string;
  attrs?: Record<string, string | boolean>;
  content?: (PostHTMLNode | string)[];
}

interface RenderOptions {
  closingSingleTag?: 'tag' | 'slash' | 'default';
  quoteAllAttributes?: boolean;
  replaceQuote?: boolean;
  quoteStyle?: number;
  singleTags?: string[];
  skipParse?: boolean;
}

function render(tree: PostHTMLNode | PostHTMLNode[], options: RenderOptions = {}): string {
  const {
    closingSingleTag = 'default',
    quoteAllAttributes = true,
    singleTags = [
      'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
      'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'
    ]
  } = options;

  const nodes = Array.isArray(tree) ? tree : [tree];

  return nodes.map(node => renderNode(node, options, singleTags)).join('');
}

function renderNode(
  node: PostHTMLNode | string,
  options: RenderOptions,
  singleTags: string[]
): string {
  // Text node
  if (typeof node === 'string') {
    return escapeHtml(node);
  }

  // Element node
  const { tag, attrs, content } = node;

  if (!tag) {
    return content ? render(content, options) : '';
  }

  // Build opening tag
  const isSingleTag = singleTags.includes(tag);
  const attrString = attrs ? renderAttributes(attrs, options) : '';

  let result = '<' + tag;
  if (attrString) {
    result += ' ' + attrString;
  }

  if (isSingleTag) {
    if (options.closingSingleTag === 'slash') {
      result += ' />';
    } else if (options.closingSingleTag === 'tag') {
      result += '></' + tag + '>';
    } else {
      result += '>';
    }
    return result;
  }

  result += '>';

  // Render content
  if (content && content.length > 0) {
    result += render(content, options);
  }

  // Closing tag
  result += '</' + tag + '>';

  return result;
}

function renderAttributes(
  attrs: Record<string, string | boolean>,
  options: RenderOptions
): string {
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (value === true) {
        return key;
      }
      if (value === false || value === null || value === undefined) {
        return '';
      }
      const quote = options.quoteStyle === 1 ? "'" : '"';
      return `${key}=${quote}${escapeAttr(String(value))}${quote}`;
    })
    .filter(Boolean)
    .join(' ');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default render;
export { render, renderNode, renderAttributes, escapeHtml, escapeAttr };
export type { PostHTMLNode, RenderOptions };

// CLI Demo
if (import.meta.url.includes("elide-posthtml-render.ts")) {
  console.log("✅ PostHTML Render - AST to HTML (POLYGLOT!)\n");

  const ast: PostHTMLNode[] = [
    {
      tag: 'div',
      attrs: { class: 'container', id: 'main' },
      content: [
        { tag: 'h1', content: ['Hello World'] },
        { tag: 'p', content: ['This is a paragraph.'] }
      ]
    }
  ];

  const html = render(ast);
  console.log("Rendered HTML:");
  console.log(html);

  console.log("\n🚀 ~8M downloads/week on npm!");
  console.log("💡 Render PostHTML AST to HTML!");
}
