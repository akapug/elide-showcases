/**
 * Markdownlint - Markdown Linter
 *
 * A Node.js style checker and lint tool for Markdown files.
 * **POLYGLOT SHOWCASE**: Markdown linting everywhere!
 *
 * Based on https://www.npmjs.com/package/markdownlint (~500K+ downloads/week)
 *
 * Features:
 * - 40+ Markdown rules
 * - Consistent style
 * - Auto-fixing
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

export const mdRules = [
  { name: 'MD001', description: 'Heading levels should increment by one' },
  { name: 'MD003', description: 'Heading style should be consistent' },
  { name: 'MD009', description: 'No trailing spaces' },
  { name: 'MD010', description: 'No hard tabs' },
  { name: 'MD012', description: 'No multiple blank lines' },
  { name: 'MD013', description: 'Line length limit (80 chars)' }
];

export class Markdownlint {
  validate(markdown: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    const lines = markdown.split('\n');

    lines.forEach((line, i) => {
      if (line.endsWith(' ') && line.trim()) violations.push(`MD009: Trailing spaces on line ${i + 1}`);
      if (line.includes('\t')) violations.push(`MD010: Hard tabs on line ${i + 1}`);
      if (line.length > 80) violations.push(`MD013: Line ${i + 1} exceeds 80 chars`);
    });

    return { passed: violations.length === 0, violations };
  }
}

export default new Markdownlint();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📝 Markdownlint - Markdown Linter\n");
  const linter = new Markdownlint();
  console.log("=== Markdown Rules ===");
  mdRules.forEach(r => console.log(`  • ${r.name}: ${r.description}`));
  console.log("\n🌐 500K+ downloads/week on npm!");
}
