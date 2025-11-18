/**
 * Google ZX - Shell Scripting with JavaScript (Google's ZX)
 *
 * Write shell scripts with JavaScript - Google's official ZX.
 * **POLYGLOT SHOWCASE**: Google ZX for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/zx by Google (~50K+ downloads/week)
 *
 * Features:
 * - Google's shell scripting tool
 * - Template literal syntax
 * - Async/await support
 * - Built-in utilities
 * - Colorful CLI output
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need shell automation
 * - ONE implementation works everywhere on Elide
 * - Consistent scripting API
 * - Share Google ZX scripts across languages
 *
 * Use cases:
 * - DevOps automation
 * - Build scripts
 * - Deployment automation
 * - System administration
 *
 * Package has ~50K+ downloads/week on npm - Google's shell scripting tool!
 */

import { execSync } from 'child_process';

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute command using template literal (Google ZX style)
 */
export async function $(strings: TemplateStringsArray, ...values: any[]): Promise<ProcessResult> {
  const command = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] !== undefined ? String(values[i]) : '');
  }, '');

  console.log(`$ ${command}`);

  return new Promise((resolve, reject) => {
    try {
      const stdout = execSync(command, { encoding: 'utf8' });
      resolve({ stdout, stderr: '', exitCode: 0 });
    } catch (error: any) {
      reject({
        stdout: error.stdout || '',
        stderr: error.stderr || String(error),
        exitCode: error.status || 1,
      });
    }
  });
}

/**
 * Change directory
 */
export function cd(dir: string): void {
  process.chdir(dir);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Quote shell arguments
 */
export function quote(str: string): string {
  if (!/[^\w@%+=:,./-]/.test(str)) return str;
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

/**
 * Chalk-like colors
 */
export const chalk = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
};

export default { $, cd, sleep, quote, chalk };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔷 Google ZX - Shell Scripting for Elide (POLYGLOT!)\n");

  (async () => {
    console.log("=== Example 1: Basic Commands ===");
    try {
      await $`echo "Hello from Google ZX!"`;
    } catch (e) {
      console.error(e);
    }
    console.log();

    console.log("=== Example 2: Quote Arguments ===");
    const arg = "file with spaces.txt";
    console.log("Quoted:", quote(arg));
    console.log();

    console.log("=== Example 3: Colorful Output ===");
    console.log(chalk.green("✓ Success"));
    console.log(chalk.red("✗ Error"));
    console.log(chalk.yellow("⚠ Warning"));
    console.log(chalk.blue("ℹ Info"));
    console.log();

    console.log("=== Example 4: POLYGLOT Use Case ===");
    console.log("🌐 Google ZX works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log();

    console.log("🚀 ~50K+ downloads/week on npm!");
  })();
}
