/**
 * Case Converter
 * More case conversion variants
 */

export function camelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
}

export function pascalCase(str: string): string {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '')
    .toLowerCase();
}

export function kebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/[_\s]+/g, '-')
    .replace(/^-/, '')
    .toLowerCase();
}

export function constantCase(str: string): string {
  return snakeCase(str).toUpperCase();
}

export function dotCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '.$1')
    .replace(/[-_\s]+/g, '.')
    .replace(/^\./, '')
    .toLowerCase();
}

export function pathCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '/$1')
    .replace(/[-_\s]+/g, '/')
    .replace(/^\//, '')
    .toLowerCase();
}

export function titleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

export function sentenceCase(str: string): string {
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// CLI demo
if (import.meta.url.includes("case-converter.ts")) {
  console.log("Case Converter Demo\n");

  const examples = [
    "hello world",
    "HelloWorld",
    "hello_world",
    "hello-world"
  ];

  examples.forEach(str => {
    console.log(`Input: "${str}"`);
    console.log(`  camelCase: ${camelCase(str)}`);
    console.log(`  PascalCase: ${pascalCase(str)}`);
    console.log(`  snake_case: ${snakeCase(str)}`);
    console.log(`  kebab-case: ${kebabCase(str)}`);
    console.log(`  CONSTANT_CASE: ${constantCase(str)}`);
    console.log(`  dot.case: ${dotCase(str)}`);
    console.log(`  path/case: ${pathCase(str)}`);
    console.log(`  Title Case: ${titleCase(str)}`);
    console.log(`  Sentence case: ${sentenceCase(str)}`);
    console.log();
  });

  console.log("✅ Case converter test passed");
}
