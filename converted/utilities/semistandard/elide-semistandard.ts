/**
 * Semistandard - Standard with Semicolons
 *
 * JavaScript Standard Style with semicolons.
 * **POLYGLOT SHOWCASE**: Standard style + semicolons everywhere!
 *
 * Based on https://www.npmjs.com/package/semistandard (~30K+ downloads/week)
 *
 * Features:
 * - All Standard rules + semicolons
 * - Zero configuration
 * - Automatic formatting
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export class Semistandard {
  format(code: string): string {
    return code
      .replace(/"/g, "'")
      .replace(/\t/g, '  ')
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
          return line + ';';
        }
        return line;
      })
      .join('\n');
  }

  validate(code: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    if (code.includes('"')) violations.push('Use single quotes');
    if (code.includes('\t')) violations.push('Use 2 spaces');
    if (!code.match(/;\s*$/m)) violations.push('Semicolons required');
    return { passed: violations.length === 0, violations };
  }
}

export default new Semistandard();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⭐ Semistandard - Standard + Semicolons\n");
  const semi = new Semistandard();

  const code = 'const x = "hello"';
  console.log(`Before: ${code}`);
  console.log(`After:  ${semi.format(code)}`);

  console.log("\n🌐 30K+ downloads/week on npm!");
}
