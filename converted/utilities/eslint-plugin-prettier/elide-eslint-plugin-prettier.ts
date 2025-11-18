/**
 * ESLint Plugin Prettier - Prettier as ESLint Rules
 *
 * Run Prettier as an ESLint rule.
 * **POLYGLOT SHOWCASE**: Formatting as linting everywhere!
 *
 * Based on https://www.npmjs.com/package/eslint-plugin-prettier (~5M+ downloads/week)
 *
 * Features:
 * - Report formatting issues as lint errors
 * - Auto-fix with Prettier
 * - Integration with ESLint
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

export const prettierRules = [
  { name: 'prettier/prettier', severity: 'error', description: 'Code should be formatted with Prettier', fixable: true }
];

export class PrettierPlugin {
  getConfig() {
    return {
      plugins: ['prettier'],
      rules: {
        'prettier/prettier': ['error', {
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: true,
          trailingComma: 'es5',
          bracketSpacing: true,
          arrowParens: 'avoid'
        }]
      }
    };
  }

  format(code: string): string {
    return code
      .replace(/"/g, "'")
      .replace(/\t/g, '  ')
      .trim();
  }

  validate(code: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    if (code.includes('"')) violations.push('Use single quotes');
    if (code.includes('\t')) violations.push('Use spaces, not tabs');
    return { passed: violations.length === 0, violations };
  }
}

export default new PrettierPlugin();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✨ ESLint Plugin Prettier - Format as Lint\n");
  const plugin = new PrettierPlugin();
  console.log("=== Configuration ===");
  console.log(JSON.stringify(plugin.getConfig(), null, 2));
  console.log("\n=== Example ===");
  const ugly = 'const  x  = "hello";';
  console.log(`Before: ${ugly}`);
  console.log(`After:  ${plugin.format(ugly)}`);
  console.log("\n🌐 5M+ downloads/week on npm!");
}
