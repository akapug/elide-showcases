/**
 * ESLint Formatter Codeframe - Code Context Formatter
 *
 * ESLint formatter with code context snippets.
 * **POLYGLOT SHOWCASE**: Contextual error reporting everywhere!
 *
 * Based on https://www.npmjs.com/package/eslint-formatter-codeframe (~500K+ downloads/week)
 *
 * Features:
 * - Show code context
 * - Syntax highlighting
 * - Error position markers
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

export interface LintMessage {
  ruleId: string;
  severity: 1 | 2;
  message: string;
  line: number;
  column: number;
  source?: string;
}

export interface LintResult {
  filePath: string;
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
  source?: string;
}

export class CodeframeFormatter {
  format(results: LintResult[]): string {
    let output = '\n';

    results.forEach(result => {
      if (result.messages.length === 0) return;

      output += `\x1b[4m${result.filePath}\x1b[0m\n\n`;

      result.messages.forEach(msg => {
        const severity = msg.severity === 2 ? '\x1b[31merror\x1b[0m' : '\x1b[33mwarning\x1b[0m';
        output += `  ${severity}: ${msg.message} (${msg.ruleId})\n`;
        output += `  \x1b[90m${msg.line}:${msg.column}\x1b[0m\n`;

        if (msg.source) {
          const lines = msg.source.split('\n');
          const targetLine = lines[msg.line - 1] || '';
          const lineNum = String(msg.line).padStart(4);

          output += `\n  \x1b[90m${lineNum} |\x1b[0m ${targetLine}\n`;
          output += `  \x1b[90m     |\x1b[0m ${' '.repeat(msg.column - 1)}\x1b[31m^\x1b[0m\n\n`;
        }
      });
    });

    return output;
  }
}

export default new CodeframeFormatter();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📋 ESLint Formatter Codeframe - Context Formatter\n");

  const formatter = new CodeframeFormatter();
  const results: LintResult[] = [
    {
      filePath: '/src/app.ts',
      messages: [
        {
          ruleId: 'no-console',
          severity: 2,
          message: 'Unexpected console statement',
          line: 1,
          column: 1,
          source: 'console.log("test");'
        }
      ],
      errorCount: 1,
      warningCount: 0
    }
  ];

  console.log(formatter.format(results));
  console.log("🌐 500K+ downloads/week on npm!");
}
