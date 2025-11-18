/**
 * tslint-config-airbnb - Airbnb TSLint Config
 *
 * Airbnb's TSLint configuration for TypeScript.
 * **POLYGLOT SHOWCASE**: Airbnb code standards for ALL languages!
 *
 * Based on https://www.npmjs.com/package/tslint-config-airbnb (~100K+ downloads/week)
 *
 * Features:
 * - Airbnb style guide
 * - Comprehensive rules
 * - Best practices
 * - Type safety rules
 * - Import rules
 * - Formatting rules
 *
 * Polyglot Benefits:
 * - Airbnb standards everywhere
 * - Share configurations
 * - Consistent code style
 * - Industry best practices
 *
 * Use cases:
 * - Team code standards
 * - Style enforcement
 * - Code quality
 * - Best practices
 *
 * Package has ~100K+ downloads/week on npm!
 */

export const config = {
  extends: ['tslint:recommended'],
  rules: {
    'array-type': [true, 'array'],
    'arrow-parens': [true, 'ban-single-arg-parens'],
    'import-spacing': true,
    'indent': [true, 'spaces', 2],
    'interface-name': [true, 'never-prefix'],
    'max-line-length': [true, 120],
    'no-consecutive-blank-lines': true,
    'no-console': [true, 'log', 'error'],
    'no-trailing-whitespace': true,
    'object-literal-key-quotes': [true, 'as-needed'],
    'quotemark': [true, 'single'],
    'semicolon': [true, 'always'],
    'trailing-comma': [true, { multiline: 'always', singleline: 'never' }],
    'typedef': [true, 'call-signature', 'parameter', 'property-declaration'],
  },
};

export default config;

// CLI Demo
if (import.meta.url.includes("elide-tslint-config-airbnb.ts")) {
  console.log("✈️  tslint-config-airbnb - Airbnb TSLint Config for Elide!\n");
  console.log("Airbnb Rules:", Object.keys(config.rules).length);
  console.log("Rules:", config.rules);
  console.log("\n🚀 Airbnb code standards - ~100K+ downloads/week!");
}
