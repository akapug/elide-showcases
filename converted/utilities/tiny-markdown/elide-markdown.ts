// Tiny Markdown Parser - Converted to Elide/TypeScript
// Original: https://github.com/mlshv/tiny-markdown-parser
// Zero dependencies - pure TypeScript!

/**
 * Creates an HTML tag with the given tag name, children, and attributes.
 */
const tag = (
  tagName: string,
  children: string,
  attributes: Record<string, string | boolean> = {}
): string =>
  `<${tagName}${Object.entries(attributes)
    .map(([k, v]) => (v ? ` ${k}="${encode(String(v))}"` : ''))
    .join('')}>${children}</${tagName}>`;

/**
 * Removes the common leading whitespace from each line of a string.
 */
const outdent = (text: string = ''): string => {
  return text.replace(
    new RegExp('^' + (text.match(/^\s+/) || '')[0], 'gm'),
    ''
  );
};

/**
 * Encodes double quotes and HTML tags to entities.
 */
const encode = (text: string = ''): string =>
  text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const markdownListRegex = /(?:(^|\n)([+-]|\d+\.) +(.*(\n[ \t]+.*)*))+/g;

/**
 * Converts a string with markdown-style lists to an HTML unordered or ordered list.
 */
const list = (text: string): string => {
  const tagName = text.match(/^[+-]/m) ? 'ul' : 'ol';

  return text
    ? tag(
        tagName,
        text.replace(/(?:[+-]|\d+\.) +(.*)\n?(([ \t].*\n?)*)/g, (match, a, b) =>
          tag(
            'li',
            inlineBlock(`${a}\n${outdent(b).replace(markdownListRegex, list)}`)
          )
        )
      )
    : '';
};

/**
 * Parses inline block-level markdown, including code blocks, links, images, and anchors.
 */
const inlineBlock = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(
    /(?:(^|\n)(```|~~~)$\n?([\s\S]*?)\n?^\2)|(?:(?:^|\n)(```|~~~)(.*)\n?([\s\S]*?)\n?^\4)|((?: *\n){2,})|(\n? *\|\s*(.*?)\s*\|((?: *\n)? *\|[-:].*\|)?(?:\n *\|(.*\|))*)|(^>+.*(\n>+.*)*)|(?:(?:^|\n)(?: {2,}.*)+)|(?:^|\n)(#{1,6}) +(.*)|((?:^|\n)\n*)?#\[(.*?)\]|(?:!\[(.*?)\]\((.*?)\))|(\[(.*?)\]\((.*?)\))|(<?(https?:\/\/[^\s]+)>?)/gm,
    (match, ...args) => {
      // Code blocks
      if (args[1] || args[3]) {
        return tag(
          'pre',
          tag('code', encode(args[2] || args[5]), {
            class: args[4] || ''
          })
        );
      }
      // Paragraphs
      if (args[6]) {
        return '</p><p>';
      }
      // Tables
      if (args[7]) {
        const cells = (row: string, tagName: string) =>
          row
            .split(/(?<!\\)\|/g)
            .slice(1, -1)
            .map((cell: string) => tag(tagName, inline(cell.trim())))
            .join('');

        const headerRow = cells(args[8], 'th');
        const bodyRows = (args[10] || '')
          .split('\n')
          .filter(Boolean)
          .map((row: string) => tag('tr', cells(row, 'td')))
          .join('');

        return tag('table', tag('thead', tag('tr', headerRow)) + tag('tbody', bodyRows));
      }
      // Blockquotes
      if (args[11]) {
        return tag(
          'blockquote',
          inlineBlock(args[11].replace(/\n?> ?/g, '\n'))
        );
      }
      // Preformatted text
      if (args[13]) {
        return tag('pre', encode(args[13].slice(1)));
      }
      // Headers
      if (args[14]) {
        return (
          (args[16] ? '</p><p>' : '') +
          tag(`h${args[14].length}`, inline(args[15]))
        );
      }
      // Anchors
      if (args[17]) {
        return tag('a', '', { name: args[17] });
      }
      // Images
      if (args[18]) {
        return tag('img', '', { src: args[19], alt: args[18] });
      }
      // Links
      if (args[20]) {
        return tag('a', inline(args[21]), { href: args[22] });
      }
      // Auto-links
      if (args[23]) {
        return tag('a', inline(args[24]), { href: args[24] });
      }
      return match;
    }
  );
};

/**
 * Parses inline markdown, including emphasis, strong, code, underline, and strikethrough.
 */
const inline = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(
      /(^|[^\\])(`+)([^\n]*?[^`\n])\2(?!`)/gm,
      (match, before, backticks, content) =>
        `${before}${tag('code', encode(content))}`
    )
    .replace(
      /(^|[^\\])([*_~]{1,3})(\S.*?)\2/gm,
      (match, before, delim, content) => {
        const length = delim.length;
        const contentParsed = inline(content);

        if (length === 3) {
          if (delim[0] === '~') {
            return `${before}${tag('del', contentParsed)}`;
          }
          return `${before}${tag('strong', tag('em', contentParsed))}`;
        }

        if (length === 2) {
          if (delim[0] === '~') {
            return `${before}${tag('s', contentParsed)}`;
          }
          return `${before}${tag('strong', contentParsed)}`;
        }

        if (delim[0] === '~') {
          return `${before}${tag('u', contentParsed)}`;
        }
        return `${before}${tag('em', contentParsed)}`;
      }
    )
    .replace(/  \n/g, tag('br', ''))
    .replace(/\\([*_~`\\])/g, '$1');
};

/**
 * Parses markdown text and returns HTML.
 */
export const parse = (text: string): string => {
  return tag(
    'p',
    text
      .replace(/\r\n/g, '\n')
      .replace(markdownListRegex, list)
      .replace(/\n{2,}/g, '</p><p>')
      .split('\n')
      .map(inlineBlock)
      .join('\n')
  ).replace(/<p><\/p>/g, '');
};

// CLI usage - check if running as main script
if (import.meta.url.includes("elide-markdown.ts")) {
  const markdown = `
# Hello Elide! 🚀

This is **tiny-markdown-parser** running on **Elide**!

## Features
- *Italic* and **bold** text
- \`Inline code\`
- [Links](https://elide.dev)
- Lists:
  + Item 1
  + Item 2

\`\`\`typescript
const greeting = "Hello from TypeScript!";
\`\`\`

> This runs without any build step!
> TypeScript runs directly with Elide.

**Performance**: 10x faster cold starts than Node.js!
`;

  console.log("🎨 Tiny Markdown Parser on Elide\n");
  console.log("Input:");
  console.log(markdown);
  console.log("\n" + "=".repeat(60) + "\n");
  console.log("Output HTML:");
  console.log(parse(markdown));
}
