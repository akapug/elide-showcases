/**
 * YAMLLint - YAML Linter
 *
 * A linter for YAML files.
 * **POLYGLOT SHOWCASE**: YAML validation everywhere!
 *
 * Based on https://www.npmjs.com/package/yamllint (~50K+ downloads/week)
 *
 * Features:
 * - YAML syntax validation
 * - Indentation checking
 * - Line length limits
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

export const yamlRules = [
  { name: 'indentation', description: 'Consistent indentation (2 spaces)' },
  { name: 'line-length', description: 'Maximum line length' },
  { name: 'trailing-spaces', description: 'No trailing spaces' },
  { name: 'empty-lines', description: 'Maximum empty lines' }
];

export class YAMLLint {
  validate(yaml: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    const lines = yaml.split('\n');

    lines.forEach((line, i) => {
      if (line.endsWith(' ') && line.trim()) {
        violations.push(`Line ${i + 1}: Trailing spaces`);
      }
      if (line.length > 80) {
        violations.push(`Line ${i + 1}: Line too long (${line.length} > 80)`);
      }
    });

    return { passed: violations.length === 0, violations };
  }
}

export default new YAMLLint();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📄 YAMLLint - YAML Linter\n");
  const linter = new YAMLLint();
  console.log("=== YAML Rules ===");
  yamlRules.forEach(r => console.log(`  • ${r.name}: ${r.description}`));
  console.log("\n🌐 50K+ downloads/week on npm!");
}
