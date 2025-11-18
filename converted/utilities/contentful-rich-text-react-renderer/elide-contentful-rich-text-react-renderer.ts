/**
 * @contentful/rich-text-react-renderer - Rich Text Rendering
 *
 * React renderer for Contentful rich text field type.
 * **POLYGLOT SHOWCASE**: One rich text renderer for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@contentful/rich-text-react-renderer (~200K+ downloads/week)
 *
 * Features:
 * - Renders Contentful rich text documents
 * - Custom node renderers
 * - Embedded entries/assets support
 * - Hyperlink handling
 * - Mark rendering (bold, italic, code)
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java can render rich text
 * - ONE renderer works everywhere on Elide
 * - Consistent rich text output across languages
 * - Share rendering logic across your stack
 *
 * Use cases:
 * - Blog content rendering
 * - Documentation display
 * - CMS content presentation
 * - Rich text email generation
 *
 * Package has ~200K+ downloads/week on npm - essential for Contentful!
 */

type NodeType =
  | 'document'
  | 'paragraph'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'heading-4'
  | 'heading-5'
  | 'heading-6'
  | 'ordered-list'
  | 'unordered-list'
  | 'list-item'
  | 'hr'
  | 'blockquote'
  | 'embedded-entry-block'
  | 'embedded-asset-block'
  | 'hyperlink'
  | 'text';

type MarkType = 'bold' | 'italic' | 'underline' | 'code';

interface Mark {
  type: MarkType;
}

interface RichTextNode {
  nodeType: NodeType;
  content?: RichTextNode[];
  value?: string;
  marks?: Mark[];
  data?: any;
}

interface RenderOptions {
  renderNode?: Partial<Record<NodeType, (node: RichTextNode) => string>>;
  renderMark?: Partial<Record<MarkType, (text: string) => string>>;
}

/**
 * Default node renderers
 */
const defaultNodeRenderers: Record<NodeType, (node: RichTextNode, render: (n: RichTextNode) => string) => string> = {
  'document': (node, render) => node.content?.map(render).join('') || '',
  'paragraph': (node, render) => `<p>${node.content?.map(render).join('') || ''}</p>`,
  'heading-1': (node, render) => `<h1>${node.content?.map(render).join('') || ''}</h1>`,
  'heading-2': (node, render) => `<h2>${node.content?.map(render).join('') || ''}</h2>`,
  'heading-3': (node, render) => `<h3>${node.content?.map(render).join('') || ''}</h3>`,
  'heading-4': (node, render) => `<h4>${node.content?.map(render).join('') || ''}</h4>`,
  'heading-5': (node, render) => `<h5>${node.content?.map(render).join('') || ''}</h5>`,
  'heading-6': (node, render) => `<h6>${node.content?.map(render).join('') || ''}</h6>`,
  'ordered-list': (node, render) => `<ol>${node.content?.map(render).join('') || ''}</ol>`,
  'unordered-list': (node, render) => `<ul>${node.content?.map(render).join('') || ''}</ul>`,
  'list-item': (node, render) => `<li>${node.content?.map(render).join('') || ''}</li>`,
  'hr': () => '<hr>',
  'blockquote': (node, render) => `<blockquote>${node.content?.map(render).join('') || ''}</blockquote>`,
  'embedded-entry-block': (node) => `<div class="embedded-entry">${node.data?.target?.fields?.title || 'Embedded Entry'}</div>`,
  'embedded-asset-block': (node) => `<img src="${node.data?.target?.fields?.file?.url || ''}" alt="${node.data?.target?.fields?.title || ''}">`,
  'hyperlink': (node, render) => `<a href="${node.data?.uri || '#'}">${node.content?.map(render).join('') || ''}</a>`,
  'text': (node) => node.value || '',
};

/**
 * Default mark renderers
 */
const defaultMarkRenderers: Record<MarkType, (text: string) => string> = {
  bold: (text) => `<strong>${text}</strong>`,
  italic: (text) => `<em>${text}</em>`,
  underline: (text) => `<u>${text}</u>`,
  code: (text) => `<code>${text}</code>`,
};

/**
 * Render rich text document to HTML
 */
export function documentToHtmlString(document: RichTextNode, options: RenderOptions = {}): string {
  const renderNode = (node: RichTextNode): string => {
    // Custom renderer
    if (options.renderNode?.[node.nodeType]) {
      return options.renderNode[node.nodeType]!(node);
    }

    // Default renderer
    const renderer = defaultNodeRenderers[node.nodeType];
    if (renderer) {
      let result = renderer(node, renderNode);

      // Apply marks
      if (node.marks && node.marks.length > 0) {
        for (const mark of node.marks) {
          const markRenderer = options.renderMark?.[mark.type] || defaultMarkRenderers[mark.type];
          if (markRenderer) {
            result = markRenderer(result);
          }
        }
      }

      return result;
    }

    return '';
  };

  return renderNode(document);
}

/**
 * Render rich text to plain text
 */
export function documentToPlainTextString(document: RichTextNode): string {
  const renderNode = (node: RichTextNode): string => {
    if (node.nodeType === 'text') {
      return node.value || '';
    }

    if (node.content) {
      return node.content.map(renderNode).join('');
    }

    return '';
  };

  return renderNode(document);
}

export default { documentToHtmlString, documentToPlainTextString };

// CLI Demo
if (import.meta.url.includes("elide-contentful-rich-text-react-renderer.ts")) {
  console.log("📝 Contentful Rich Text Renderer (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Rich Text ===");
  const basicDoc: RichTextNode = {
    nodeType: 'document',
    content: [
      {
        nodeType: 'paragraph',
        content: [
          { nodeType: 'text', value: 'Hello, world!', marks: [{ type: 'bold' }] }
        ]
      }
    ]
  };
  console.log("HTML:", documentToHtmlString(basicDoc));
  console.log();

  console.log("=== Example 2: Headings ===");
  const headingsDoc: RichTextNode = {
    nodeType: 'document',
    content: [
      { nodeType: 'heading-1', content: [{ nodeType: 'text', value: 'Main Title' }] },
      { nodeType: 'heading-2', content: [{ nodeType: 'text', value: 'Subtitle' }] }
    ]
  };
  console.log("HTML:", documentToHtmlString(headingsDoc));
  console.log();

  console.log("=== Example 3: Lists ===");
  const listDoc: RichTextNode = {
    nodeType: 'document',
    content: [
      {
        nodeType: 'unordered-list',
        content: [
          { nodeType: 'list-item', content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Item 1' }] }] },
          { nodeType: 'list-item', content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Item 2' }] }] }
        ]
      }
    ]
  };
  console.log("HTML:", documentToHtmlString(listDoc));
  console.log();

  console.log("=== Example 4: Hyperlinks ===");
  const linkDoc: RichTextNode = {
    nodeType: 'document',
    content: [
      {
        nodeType: 'paragraph',
        content: [
          {
            nodeType: 'hyperlink',
            data: { uri: 'https://example.com' },
            content: [{ nodeType: 'text', value: 'Click here' }]
          }
        ]
      }
    ]
  };
  console.log("HTML:", documentToHtmlString(linkDoc));
  console.log();

  console.log("=== Example 5: Custom Renderer ===");
  const customDoc: RichTextNode = {
    nodeType: 'document',
    content: [
      { nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Custom paragraph' }] }
    ]
  };
  const customHtml = documentToHtmlString(customDoc, {
    renderNode: {
      'paragraph': (node) => `<div class="custom-paragraph">${node.content?.map(n => n.value).join('')}</div>`
    }
  });
  console.log("Custom HTML:", customHtml);
  console.log();

  console.log("=== Example 6: Plain Text ===");
  const plainDoc: RichTextNode = {
    nodeType: 'document',
    content: [
      { nodeType: 'heading-1', content: [{ nodeType: 'text', value: 'Title' }] },
      { nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Content here', marks: [{ type: 'bold' }] }] }
    ]
  };
  console.log("Plain text:", documentToPlainTextString(plainDoc));
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same rich text renderer works in:");
  console.log("  • JavaScript/TypeScript (React SSR)");
  console.log("  • Python (Django templates)");
  console.log("  • Ruby (Rails views)");
  console.log("  • Java (Spring Boot)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One renderer, all languages");
  console.log("  ✓ Consistent content display");
  console.log("  ✓ Share rendering logic");
  console.log("  ✓ Unified rich text handling");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Blog content rendering");
  console.log("- Documentation display");
  console.log("- CMS content presentation");
  console.log("- Rich text email generation");
  console.log("- Marketing pages");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast rendering");
  console.log("- Instant execution on Elide");
  console.log("- ~200K+ downloads/week on npm!");
}
