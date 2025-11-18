/**
 * ESLint Formatter Pretty - Beautiful ESLint Output
 *
 * Pretty formatter for ESLint with colors and better readability.
 * **POLYGLOT SHOWCASE**: Beautiful linting output everywhere!
 *
 * Based on https://www.npmjs.com/package/eslint-formatter-pretty (~100K+ downloads/week)
 *
 * Features:
 * - Colorful output
 * - File grouping
 * - Error highlighting
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface LintMessage {
  ruleId: string;
  severity: 1 | 2;
  message: string;
  line: number;
  column: number;
}

export interface LintResult {
  filePath: string;
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
}

export class PrettyFormatter {
  format(results: LintResult[]): string {
    let output = '\n';

    results.forEach(result => {
      if (result.messages.length === 0) return;

      output += `\x1b[4m${result.filePath}\x1b[0m\n`;

      result.messages.forEach(msg => {
        const icon = msg.severity === 2 ? '\x1b[31m✖\x1b[0m' : '\x1b[33m⚠\x1b[0m';
        const pos = `\x1b[90m${msg.line}:${msg.column}\x1b[0m`;
        output += `  ${icon}  ${pos}  ${msg.message}  \x1b[90m${msg.ruleId}\x1b[0m\n`;
      });

      output += '\n';
    });

    const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);

    if (totalErrors > 0) {
      output += `\x1b[31m✖ ${totalErrors} error${totalErrors !== 1 ? 's' : ''}\x1b[0m `;
    }
    if (totalWarnings > 0) {
      output += `\x1b[33m⚠ ${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}\x1b[0m`;
    }

    return output + '\n';
  }
}

export default new PrettyFormatter();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 ESLint Formatter Pretty - Beautiful Output\n");

  const formatter = new PrettyFormatter();
  const results: LintResult[] = [
    {
      filePath: '/src/app.ts',
      messages: [
        { ruleId: 'no-console', severity: 2, message: 'Unexpected console statement', line: 10, column: 5 },
        { ruleId: 'no-unused-vars', severity: 1, message: "'x' is defined but never used", line: 5, column: 7 }
      ],
      errorCount: 1,
      warningCount: 1
    }
  ];

  console.log(formatter.format(results));
  console.log("🌐 100K+ downloads/week on npm!");
}
