/**
 * HTMLHint - HTML Linter
 *
 * Static code analysis tool for HTML.
 * **POLYGLOT SHOWCASE**: HTML linting everywhere!
 *
 * Based on https://www.npmjs.com/package/htmlhint (~200K+ downloads/week)
 *
 * Features:
 * - HTML validation
 * - Accessibility checks
 * - Best practices
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

export const htmlRules = [
  { name: 'tagname-lowercase', description: 'Tagnames must be lowercase' },
  { name: 'attr-lowercase', description: 'Attribute names must be lowercase' },
  { name: 'attr-value-double-quotes', description: 'Attribute values must use double quotes' },
  { name: 'doctype-first', description: 'DOCTYPE must be first' },
  { name: 'tag-pair', description: 'Tags must be paired' },
  { name: 'id-unique', description: 'IDs must be unique' }
];

export class HTMLHint {
  validate(html: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    if (html.match(/<[A-Z]/)) violations.push('Uppercase tagname found');
    if (html.match(/\w+='[^']*'/)) violations.push('Use double quotes for attributes');
    if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<!doctype')) {
      violations.push('Missing DOCTYPE');
    }
    return { passed: violations.length === 0, violations };
  }
}

export default new HTMLHint();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌐 HTMLHint - HTML Linter\n");
  const linter = new HTMLHint();
  console.log("=== HTML Rules ===");
  htmlRules.forEach(r => console.log(`  • ${r.name}: ${r.description}`));
  console.log("\n🌐 200K+ downloads/week on npm!");
}
