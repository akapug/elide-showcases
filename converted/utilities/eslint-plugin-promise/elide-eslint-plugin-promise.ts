/**
 * ESLint Plugin Promise - Promise Best Practices
 *
 * Enforce best practices for JavaScript promises.
 * **POLYGLOT SHOWCASE**: Promise patterns for ALL async code!
 *
 * Based on https://www.npmjs.com/package/eslint-plugin-promise (~3M+ downloads/week)
 *
 * Features:
 * - Catch error handling
 * - Promise return patterns
 * - Async/await best practices
 * - Zero dependencies
 *
 * Package has ~3M+ downloads/week on npm!
 */

export const promiseRules = [
  { name: 'promise/always-return', severity: 'error', description: 'Always return in promise callbacks' },
  { name: 'promise/catch-or-return', severity: 'error', description: 'Enforces catch or return' },
  { name: 'promise/no-return-wrap', severity: 'warn', description: 'Avoid wrapping values in Promise.resolve' },
  { name: 'promise/param-names', severity: 'warn', description: 'Use resolve/reject param names' },
  { name: 'promise/no-nesting', severity: 'warn', description: 'Avoid nested promises' },
  { name: 'promise/no-callback-in-promise', severity: 'warn', description: 'Avoid callbacks in promises' }
];

export class PromisePlugin {
  getConfig() {
    const rules: Record<string, any> = {};
    promiseRules.forEach(r => rules[r.name] = r.severity);
    return { plugins: ['promise'], rules };
  }

  validate(code: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    if (code.includes('.then(') && !code.includes('.catch(') && !code.includes('await')) {
      violations.push('Promise should have .catch() or be awaited');
    }
    return { passed: violations.length === 0, violations };
  }
}

export default new PromisePlugin();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🤝 ESLint Plugin Promise - Promise Best Practices\n");
  const plugin = new PromisePlugin();
  console.log("=== Promise Rules ===");
  promiseRules.forEach(r => console.log(`  ${r.severity === 'error' ? '🔴' : '🟡'} ${r.name}: ${r.description}`));
  console.log("\n=== Example Validation ===");
  const result = plugin.validate('fetch("/api").then(res => res.json());');
  console.log(`Passed: ${result.passed ? '✓' : '✗'}`);
  result.violations.forEach(v => console.log(`  - ${v}`));
  console.log("\n🌐 3M+ downloads/week on npm!");
}
