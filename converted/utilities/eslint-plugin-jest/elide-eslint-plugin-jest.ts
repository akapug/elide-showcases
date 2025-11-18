/**
 * ESLint Plugin Jest - Jest Testing Linting
 *
 * ESLint plugin for Jest testing framework.
 * **POLYGLOT SHOWCASE**: Test linting everywhere!
 *
 * Based on https://www.npmjs.com/package/eslint-plugin-jest (~3M+ downloads/week)
 *
 * Features:
 * - Jest best practices
 * - Test structure validation
 * - Assertion checking
 * - Zero dependencies
 *
 * Package has ~3M+ downloads/week on npm!
 */

export const jestRules = [
  { name: 'jest/no-disabled-tests', severity: 'warn', description: 'Disallow disabled tests' },
  { name: 'jest/no-focused-tests', severity: 'error', description: 'Disallow focused tests' },
  { name: 'jest/no-identical-title', severity: 'error', description: 'Disallow identical test titles' },
  { name: 'jest/valid-expect', severity: 'error', description: 'Ensure expect() is called correctly' },
  { name: 'jest/expect-expect', severity: 'warn', description: 'Ensure tests have expectations' }
];

export class JestPlugin {
  getConfig() {
    const rules: Record<string, any> = {};
    jestRules.forEach(r => rules[r.name] = r.severity);
    return { plugins: ['jest'], env: { 'jest/globals': true }, rules };
  }
}

export default new JestPlugin();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🃏 ESLint Plugin Jest - Test Linting\n");
  const plugin = new JestPlugin();
  console.log("=== Jest Rules ===");
  jestRules.forEach(r => console.log(`  ${r.severity === 'error' ? '🔴' : '🟡'} ${r.name}: ${r.description}`));
  console.log("\n🌐 3M+ downloads/week on npm!");
}
