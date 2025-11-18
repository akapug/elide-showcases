/**
 * HAML - HTML Abstraction Markup Language
 *
 * Beautiful, DRY, well-indented markup language.
 * **POLYGLOT SHOWCASE**: One template language for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/haml (~1M downloads/week)
 *
 * Features:
 * - Whitespace active syntax
 * - Elegant HTML generation
 * - Ruby-style interpolation
 * - Clean, DRY templates
 * - Automatic tag closing
 * - CSS-style ID/class shortcuts
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all love HAML
 * - ONE elegant syntax works everywhere on Elide
 * - Share templates across your polyglot stack
 * - Readable, maintainable markup
 *
 * Use cases:
 * - Web application views
 * - Email templates
 * - Markup generation
 * - Documentation
 *
 * Package has ~1M downloads/week on npm!
 */

interface HamlOptions {
  format?: 'html5' | 'xhtml';
  attrWrapper?: '"' | "'";
  selfClosingTags?: string[];
}

class Haml {
  private options: HamlOptions;

  constructor(options: HamlOptions = {}) {
    this.options = {
      format: options.format || 'html5',
      attrWrapper: options.attrWrapper || '"',
      selfClosingTags: options.selfClosingTags || ['br', 'hr', 'img', 'input', 'link', 'meta']
    };
  }

  render(template: string, locals: any = {}): string {
    const lines = template.split('\n');
    const result: string[] = [];
    const stack: Array<{ indent: number; tag: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.search(/\S/);

      if (indent === -1 || !line.trim()) continue;

      // Close tags that are no longer in scope
      while (stack.length && stack[stack.length - 1].indent >= indent) {
        const closed = stack.pop()!;
        if (!this.options.selfClosingTags!.includes(closed.tag)) {
          result.push('  '.repeat(stack.length) + `</${closed.tag}>`);
        }
      }

      const processed = this.processLine(line, locals, indent);
      if (processed) {
        const { html, tag, selfClosing } = processed;
        result.push(html);
        if (tag && !selfClosing) {
          stack.push({ indent, tag });
        }
      }
    }

    // Close remaining tags
    while (stack.length) {
      const closed = stack.pop()!;
      if (!this.options.selfClosingTags!.includes(closed.tag)) {
        result.push('  '.repeat(stack.length) + `</${closed.tag}>`);
      }
    }

    return result.join('\n');
  }

  private processLine(line: string, locals: any, indent: number): { html: string; tag?: string; selfClosing?: boolean } | null {
    const trimmed = line.trim();
    const indentStr = '  '.repeat(Math.floor(indent / 2));

    // Comments
    if (trimmed.startsWith('/')) {
      return { html: indentStr + '<!-- ' + trimmed.substring(1).trim() + ' -->' };
    }

    // Doctype
    if (trimmed.startsWith('!!!')) {
      return { html: '<!DOCTYPE html>' };
    }

    // Tags
    const tagMatch = trimmed.match(/^%([a-z0-9]+)(#[\w-]+)?(\.[\w.-]+)*(?:\{([^}]+)\})?\s*(.*)$/i);
    if (tagMatch) {
      const tag = tagMatch[1];
      const id = tagMatch[2]?.substring(1);
      const classes = tagMatch[3]?.split('.').filter(c => c).join(' ');
      const attrsStr = tagMatch[4];
      const content = tagMatch[5] || '';

      let attrs = '';
      if (id) attrs += ` id="${id}"`;
      if (classes) attrs += ` class="${classes}"`;
      if (attrsStr) {
        const pairs = attrsStr.match(/(\w+):\s*['"]([^'"]+)['"]/g);
        if (pairs) {
          pairs.forEach(pair => {
            const [key, val] = pair.split(/:\s*/);
            attrs += ` ${key}="${val.replace(/['"]/g, '')}"`;
          });
        }
      }

      const interpolated = this.interpolate(content, locals);
      const selfClosing = this.options.selfClosingTags!.includes(tag);

      if (selfClosing) {
        return {
          html: `${indentStr}<${tag}${attrs}${this.options.format === 'xhtml' ? ' /' : ''}>`,
          tag,
          selfClosing: true
        };
      } else if (interpolated) {
        return {
          html: `${indentStr}<${tag}${attrs}>${interpolated}</${tag}>`,
          tag: undefined
        };
      } else {
        return {
          html: `${indentStr}<${tag}${attrs}>`,
          tag
        };
      }
    }

    // Div shortcuts
    const divMatch = trimmed.match(/^(#[\w-]+|\.[\w.-]+)(?:\{([^}]+)\})?\s*(.*)$/);
    if (divMatch) {
      const selector = divMatch[1];
      const attrsStr = divMatch[2];
      const content = divMatch[3] || '';

      const id = selector.startsWith('#') ? selector.substring(1) : undefined;
      const classes = selector.startsWith('.') ? selector.split('.').filter(c => c).join(' ') : undefined;

      let attrs = '';
      if (id) attrs += ` id="${id}"`;
      if (classes) attrs += ` class="${classes}"`;
      if (attrsStr) {
        const pairs = attrsStr.match(/(\w+):\s*['"]([^'"]+)['"]/g);
        if (pairs) {
          pairs.forEach(pair => {
            const [key, val] = pair.split(/:\s*/);
            attrs += ` ${key}="${val.replace(/['"]/g, '')}"`;
          });
        }
      }

      const interpolated = this.interpolate(content, locals);

      if (interpolated) {
        return {
          html: `${indentStr}<div${attrs}>${interpolated}</div>`,
          tag: undefined
        };
      } else {
        return {
          html: `${indentStr}<div${attrs}>`,
          tag: 'div'
        };
      }
    }

    // Plain text
    if (trimmed.startsWith('=')) {
      const expr = trimmed.substring(1).trim();
      const value = this.interpolate(expr, locals);
      return { html: indentStr + value };
    }

    // Regular text
    return { html: indentStr + this.interpolate(trimmed, locals) };
  }

  private interpolate(text: string, data: any): string {
    return text.replace(/#{([^}]+)}/g, (match, expr) => {
      const value = this.evaluate(expr.trim(), data);
      return value !== undefined ? String(value) : '';
    });
  }

  private evaluate(expr: string, data: any): any {
    const parts = expr.split('.');
    let value: any = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}

export default Haml;

// CLI Demo
if (import.meta.url.includes("elide-haml.ts")) {
  console.log("✅ HAML - Beautiful Markup Language (POLYGLOT!)\n");

  const haml = new Haml();

  console.log("=== Example 1: Simple Template ===");
  const tmpl1 = `!!!
%html
  %head
    %title Hello
  %body
    %h1 Hello World`;
  console.log("Template:");
  console.log(tmpl1);
  console.log("\nOutput:");
  console.log(haml.render(tmpl1));
  console.log();

  console.log("=== Example 2: ID and Class Shortcuts ===");
  const tmpl2 = `#container
  .header
    %h1.title Site Title
  .content
    %p.intro Welcome`;
  console.log("Output:");
  console.log(haml.render(tmpl2));
  console.log();

  console.log("=== Example 3: Interpolation ===");
  const tmpl3 = `%h1 Welcome, #{name}!
%p Your email is #{email}`;
  console.log("Output:");
  console.log(haml.render(tmpl3, { name: "Alice", email: "alice@example.com" }));
  console.log();

  console.log("=== Example 4: Attributes ===");
  const tmpl4 = `%a{href: "/home", class: "button"} Home
%img{src: "/logo.png", alt: "Logo"}`;
  console.log("Output:");
  console.log(haml.render(tmpl4));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Web application views");
  console.log("- Email templates");
  console.log("- Markup generation");
  console.log("- Clean, maintainable HTML");
  console.log();

  console.log("🚀 Features:");
  console.log("- Beautiful, DRY syntax");
  console.log("- Automatic tag closing");
  console.log("- ~1M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- HAML is loved in Ruby, Python, and more");
  console.log("- Share templates across all languages on Elide");
  console.log("- Consistent markup in polyglot stacks");
  console.log("- Perfect for clean, readable templates!");
}
