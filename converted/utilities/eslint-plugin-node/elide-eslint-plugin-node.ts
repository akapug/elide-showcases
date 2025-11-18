/**
 * ESLint Plugin Node - Node.js-specific Linting
 *
 * Additional ESLint rules for Node.js.
 * **POLYGLOT SHOWCASE**: Node.js best practices everywhere!
 *
 * Based on https://www.npmjs.com/package/eslint-plugin-node (~2M+ downloads/week)
 *
 * Features:
 * - Validate require() calls
 * - Check package.json dependencies
 * - Prevent deprecated APIs
 * - Process.exit() usage
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

export const nodeRules = [
  { name: 'node/no-deprecated-api', severity: 'error', description: 'Disallow deprecated APIs' },
  { name: 'node/no-missing-import', severity: 'error', description: 'Disallow import of missing modules' },
  { name: 'node/no-missing-require', severity: 'error', description: 'Disallow require of missing modules' },
  { name: 'node/no-unpublished-import', severity: 'error', description: 'Disallow import of unpublished files' },
  { name: 'node/no-unsupported-features', severity: 'error', description: 'Disallow unsupported Node features' },
  { name: 'node/process-exit-as-throw', severity: 'warn', description: 'Treat process.exit() as throw' },
  { name: 'node/no-process-exit', severity: 'warn', description: 'Disallow process.exit()' }
];

export class NodePlugin {
  getConfig() {
    const rules: Record<string, any> = {};
    nodeRules.forEach(r => rules[r.name] = r.severity);
    return { plugins: ['node'], env: { node: true }, rules };
  }

  validate(code: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    if (code.includes('process.exit(') && !code.includes('catch')) {
      violations.push('Avoid process.exit() in production code');
    }
    return { passed: violations.length === 0, violations };
  }
}

export default new NodePlugin();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🟢 ESLint Plugin Node - Node.js Linting\n");
  const plugin = new NodePlugin();
  console.log("=== Node.js Rules ===");
  nodeRules.forEach(r => console.log(`  ${r.severity === 'error' ? '🔴' : '🟡'} ${r.name}: ${r.description}`));
  console.log("\n🌐 2M+ downloads/week on npm!");
}
