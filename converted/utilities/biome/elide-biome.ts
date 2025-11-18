/**
 * Biome - Fast Toolchain for Web Projects
 *
 * One toolchain for your web project: formatter, linter, and more.
 * **POLYGLOT SHOWCASE**: All-in-one tooling everywhere!
 *
 * Based on https://www.npmjs.com/package/@biomejs/biome (~100K+ downloads/week)
 *
 * Features:
 * - Extremely fast (Rust-based)
 * - Format & lint in one tool
 * - TypeScript/JavaScript/JSON
 * - Zero config
 *
 * Package has ~100K+ downloads/week on npm!
 */

export class Biome {
  format(code: string): string {
    return code
      .replace(/\t/g, '  ')
      .replace(/;\s*$/gm, ';')
      .trim();
  }

  lint(code: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    if (code.includes('var ')) violations.push('Use let or const instead of var');
    if (code.includes('==') && !code.includes('===')) violations.push('Use === instead of ==');
    return { passed: violations.length === 0, violations };
  }

  check(code: string): { formatted: string; lintResults: { passed: boolean; violations: string[] } } {
    return {
      formatted: this.format(code),
      lintResults: this.lint(code)
    };
  }
}

export default new Biome();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔬 Biome - Fast Toolchain\n");
  const biome = new Biome();

  const code = 'var  x  = 10';
  const result = biome.check(code);

  console.log(`Original: ${code}`);
  console.log(`Formatted: ${result.formatted}`);
  console.log(`Lint passed: ${result.lintResults.passed ? '✓' : '✗'}`);
  result.lintResults.violations.forEach(v => console.log(`  - ${v}`));

  console.log("\n🌐 100K+ downloads/week on npm!");
  console.log("⚡ Extremely fast (Rust-based)");
}
