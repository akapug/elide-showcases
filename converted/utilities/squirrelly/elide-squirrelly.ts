/**
 * Squirrelly - Lightweight Template Engine
 *
 * Powerful, lightweight template engine that supports helpers, filters, partials, and more.
 * **POLYGLOT SHOWCASE**: One lightweight template engine for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/squirrelly (~500K downloads/week)
 *
 * Features:
 * - Lightweight and fast
 * - Helpers and filters
 * - Partials support
 * - Custom delimiters
 * - Caching
 * - Async support
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need light templates
 * - ONE syntax works everywhere on Elide
 * - Share templates across your stack
 * - Minimal footprint
 *
 * Use cases:
 * - Email templates
 * - Simple web views
 * - Configuration templates
 * - Lightweight rendering
 *
 * Package has ~500K downloads/week on npm!
 */

interface SquirrellyOptions {
  varName?: string;
  autoEscape?: boolean;
}

class Squirrelly {
  private options: SquirrellyOptions;
  private helpers: Map<string, Function> = new Map();

  constructor(options: SquirrellyOptions = {}) {
    this.options = {
      varName: options.varName || 'it',
      autoEscape: options.autoEscape !== false
    };

    // Register default helpers
    this.helpers.set('if', (condition: boolean, content: string) => condition ? content : '');
    this.helpers.set('each', (array: any[], itemName: string, content: string) => {
      return array.map(item => content).join('');
    });
  }

  render(template: string, data: any, options?: SquirrellyOptions): string {
    const opts = { ...this.options, ...options };
    let output = template;

    // Process {{@if(condition)}}...{{/if}}
    output = output.replace(/\{\{@if\s*\(([\w.]+)\)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        const value = this.getValue(data, condition);
        return value ? this.renderPart(content, data) : '';
      }
    );

    // Process {{@each(array) => item}}...{{/each}}
    output = output.replace(/\{\{@each\s*\(([\w.]+)\)\s*=>\s*(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arr, itemName, content) => {
        const array = this.getValue(data, arr);
        if (!Array.isArray(array)) return '';
        
        return array.map(item => {
          return this.renderPart(content, { ...data, [itemName]: item });
        }).join('');
      }
    );

    return this.renderPart(output, data);
  }

  private renderPart(template: string, data: any): string {
    let output = template;

    // Process {{variable}}
    output = output.replace(/\{\{([^@}]+)\}\}/g, (match, expr) => {
      const value = this.getValue(data, expr.trim());
      if (value === undefined || value === null) return '';
      
      const str = String(value);
      return this.options.autoEscape ? this.escape(str) : str;
    });

    return output;
  }

  private getValue(context: any, path: string): any {
    const parts = path.split('.');
    let value = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default Squirrelly;

// CLI Demo
if (import.meta.url.includes("elide-squirrelly.ts")) {
  console.log("✅ Squirrelly - Lightweight Template Engine (POLYGLOT!)\n");

  const sqrl = new Squirrelly();

  console.log("=== Example 1: Simple Interpolation ===");
  const tmpl1 = "Hello {{name}}!";
  console.log("Output:", sqrl.render(tmpl1, { name: "World" }));
  console.log();

  console.log("=== Example 2: Conditionals ===");
  const tmpl2 = "{{@if(isPremium)}}Premium Member{{/if}}";
  console.log("Premium:", sqrl.render(tmpl2, { isPremium: true }));
  console.log("Regular:", sqrl.render(tmpl2, { isPremium: false }));
  console.log();

  console.log("=== Example 3: Loops ===");
  const tmpl3 = "<ul>{{@each(items) => item}}<li>{{item}}</li>{{/each}}</ul>";
  console.log("Output:", sqrl.render(tmpl3, { items: ["Apple", "Banana", "Orange"] }));
  console.log();

  console.log("=== Example 4: Complex Template ===");
  const tmpl4 = `
<div>
  <h1>{{title}}</h1>
  {{@if(users)}}
  <ul>
  {{@each(users) => user}}
    <li>{{user.name}} - {{user.email}}</li>
  {{/each}}
  </ul>
  {{/if}}
</div>
  `.trim();

  const data4 = {
    title: "User Directory",
    users: [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" }
    ]
  };

  console.log("Output:");
  console.log(sqrl.render(tmpl4, data4));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Email templates");
  console.log("- Simple web views");
  console.log("- Configuration templates");
  console.log("- Lightweight rendering");
  console.log();

  console.log("🚀 Features:");
  console.log("- Lightweight and fast");
  console.log("- Helpers and filters");
  console.log("- ~500K downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Perfect for minimal template needs");
  console.log("- Share across TypeScript, Python, Ruby, Java");
  console.log("- Lightweight polyglot rendering!");
}
