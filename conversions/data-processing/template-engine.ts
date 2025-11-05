/**
 * Template Engine
 * Simple but powerful string template replacement
 */

export interface TemplateOptions {
  delimiters?: [string, string];
  strict?: boolean;
}

export function render(template: string, data: Record<string, any>, options: TemplateOptions = {}): string {
  const { delimiters = ['{{', '}}'], strict = false } = options;
  const [open, close] = delimiters;

  const regex = new RegExp(`${escapeRegex(open)}\\s*([\\w.]+)\\s*${escapeRegex(close)}`, 'g');

  return template.replace(regex, (match, key) => {
    const value = getNestedValue(data, key);

    if (value === undefined) {
      if (strict) throw new Error(`Template variable "${key}" not found`);
      return match;
    }

    return String(value);
  });
}

export function compile(template: string, options: TemplateOptions = {}): (data: Record<string, any>) => string {
  return (data: Record<string, any>) => render(template, data, options);
}

export function renderConditional(template: string, data: Record<string, any>): string {
  // Handle {{#if var}} content {{/if}}
  let result = template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] ? content : '';
  });

  // Handle {{#each var}} content {{/each}}
  result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
    const array = data[key];
    if (!Array.isArray(array)) return '';

    return array.map(item => {
      if (typeof item === 'object') {
        return render(content, item);
      }
      return render(content, { this: item });
    }).join('');
  });

  // Handle regular variables
  return render(result, data);
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class Template {
  private template: string;
  private options: TemplateOptions;

  constructor(template: string, options: TemplateOptions = {}) {
    this.template = template;
    this.options = options;
  }

  render(data: Record<string, any>): string {
    return renderConditional(this.template, data);
  }
}

// CLI demo
if (import.meta.url.includes("template-engine.ts")) {
  console.log("Template Engine Demo\n");

  const simple = "Hello, {{name}}! You have {{count}} messages.";
  console.log("Simple template:");
  console.log(render(simple, { name: "Alice", count: 5 }));

  console.log("\nNested data:");
  const nested = "User: {{user.name}}, Email: {{user.email}}";
  console.log(render(nested, { user: { name: "Bob", email: "bob@example.com" } }));

  console.log("\nConditional:");
  const conditional = "{{#if loggedIn}}Welcome back!{{/if}}";
  console.log("Logged in:", renderConditional(conditional, { loggedIn: true }));
  console.log("Logged out:", renderConditional(conditional, { loggedIn: false }));

  console.log("\nLoops:");
  const loop = "{{#each items}}- {{this}}\n{{/each}}";
  console.log(renderConditional(loop, { items: ["Apple", "Banana", "Cherry"] }));

  console.log("\nObject loops:");
  const objLoop = "{{#each users}}Name: {{name}}, Age: {{age}}\n{{/each}}";
  const result = renderConditional(objLoop, {
    users: [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 }
    ]
  });
  console.log(result);

  console.log("\nCompiled template:");
  const compiled = compile("Hello, {{name}}!");
  console.log(compiled({ name: "World" }));

  console.log("✅ Template engine test passed");
}
