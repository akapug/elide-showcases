/**
 * HTML React Parser - Convert HTML to React Elements
 *
 * Converts HTML strings to React elements.
 * **POLYGLOT SHOWCASE**: One HTML-to-React converter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/html-react-parser (~8M downloads/week)
 *
 * Features:
 * - HTML to React conversion
 * - Preserve attributes
 * - Custom element replacement
 * - TypeScript support
 * - Fast parsing
 * - SSR compatible
 *
 * Polyglot Benefits:
 * - HTML parsing in any language
 * - ONE API for all services
 * - Share React rendering
 * - Universal rendering
 *
 * Use cases:
 * - Dynamic content rendering
 * - CMS integration
 * - SSR templates
 * - HTML sanitization
 *
 * Package has ~8M downloads/week on npm!
 */

interface ReactElement {
  type: string;
  props: Record<string, any>;
  children: (ReactElement | string)[];
}

type ReplaceFunction = (domNode: any) => ReactElement | null | undefined;

interface ParseOptions {
  replace?: ReplaceFunction;
  trim?: boolean;
}

function parse(html: string, options: ParseOptions = {}): (ReactElement | string)[] {
  const { replace, trim = true } = options;

  const elements: (ReactElement | string)[] = [];

  // Simplified HTML parsing
  const tagRegex = /<(\w+)([^>]*)>(.*?)<\/\1>|([^<]+)/gs;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match[1]) {
      // Element tag
      const element: ReactElement = {
        type: match[1],
        props: parseAttributes(match[2]),
        children: parse(match[3], options)
      };

      // Allow custom replacement
      if (replace) {
        const replacement = replace(element);
        if (replacement !== undefined) {
          if (replacement !== null) {
            elements.push(replacement);
          }
          continue;
        }
      }

      elements.push(element);
    } else if (match[4]) {
      // Text node
      const text = trim ? match[4].trim() : match[4];
      if (text) {
        elements.push(text);
      }
    }
  }

  return elements;
}

function parseAttributes(attrString: string): Record<string, any> {
  const props: Record<string, any> = {};
  const attrRegex = /(\w+)=["']([^"']*)["']|(\w+)/g;
  let match;

  while ((match = attrRegex.exec(attrString)) !== null) {
    if (match[1]) {
      // Attribute with value
      const key = attributeToProperty(match[1]);
      props[key] = match[2];
    } else if (match[3]) {
      // Boolean attribute
      const key = attributeToProperty(match[3]);
      props[key] = true;
    }
  }

  return props;
}

function attributeToProperty(attr: string): string {
  // Convert HTML attributes to React props
  const mapping: Record<string, string> = {
    'class': 'className',
    'for': 'htmlFor',
    'tabindex': 'tabIndex',
    'readonly': 'readOnly',
    'maxlength': 'maxLength',
    'cellspacing': 'cellSpacing',
    'cellpadding': 'cellPadding',
    'rowspan': 'rowSpan',
    'colspan': 'colSpan',
    'usemap': 'useMap',
    'frameborder': 'frameBorder',
  };

  return mapping[attr.toLowerCase()] || attr;
}

function htmlToReact(html: string, options?: ParseOptions): (ReactElement | string)[] {
  return parse(html, options);
}

export default parse;
export { parse, htmlToReact, attributeToProperty };
export type { ReactElement, ReplaceFunction, ParseOptions };

// CLI Demo
if (import.meta.url.includes("elide-html-react-parser.ts")) {
  console.log("✅ HTML React Parser - HTML to React (POLYGLOT!)\n");

  const html = '<div class="container"><h1>Hello</h1><p>World</p></div>';
  const elements = parse(html);

  console.log("Parsed React elements:");
  console.log("  Element count:", elements.length);
  console.log("  First element type:", (elements[0] as ReactElement)?.type);

  console.log("\n🚀 ~8M downloads/week on npm!");
  console.log("💡 Convert HTML to React elements!");
}
