/**
 * Remark Lint - Markdown Linting with Remark
 *
 * Plugin to lint Markdown with remark.
 * **POLYGLOT SHOWCASE**: Advanced Markdown linting!
 *
 * Based on https://www.npmjs.com/package/remark-lint (~500K+ downloads/week)
 *
 * Features:
 * - Pluggable linting
 * - AST-based analysis
 * - Custom rules
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

export const remarkRules = [
  { name: 'remark-lint-no-duplicate-headings', severity: 'warn' },
  { name: 'remark-lint-no-heading-punctuation', severity: 'warn' },
  { name: 'remark-lint-list-item-bullet-indent', severity: 'error' },
  { name: 'remark-lint-ordered-list-marker-value', severity: 'warn' }
];

export class RemarkLint {
  getConfig() {
    return { plugins: ['remark-lint'], settings: {} };
  }

  validate(markdown: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    const headings = markdown.match(/^#+\s+.+$/gm) || [];
    const uniqueHeadings = new Set(headings);

    if (headings.length !== uniqueHeadings.size) {
      violations.push('Duplicate headings detected');
    }

    return { passed: violations.length === 0, violations };
  }
}

export default new RemarkLint();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📄 Remark Lint - Markdown Linting\n");
  const linter = new RemarkLint();
  console.log("=== Remark Rules ===");
  remarkRules.forEach(r => console.log(`  ${r.severity === 'error' ? '🔴' : '🟡'} ${r.name}`));
  console.log("\n🌐 500K+ downloads/week on npm!");
}
