/**
 * Exec-sh - Execute Shell Commands
 *
 * Execute shell commands with proper shell handling.
 * **POLYGLOT SHOWCASE**: Shell execution for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/exec-sh (~200K+ downloads/week)
 *
 * Features:
 * - Execute shell commands
 * - Cross-platform support
 * - Promise-based API
 * - Stream support
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

import { exec } from 'child_process';

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  shell?: string;
}

export function execSh(command: string, options?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, {
      cwd: options?.cwd,
      env: options?.env || process.env,
      shell: options?.shell || '/bin/sh',
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

export default execSh;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ Exec-sh - Execute Shell (POLYGLOT!)\n");

  (async () => {
    try {
      const result = await execSh('echo "Hello from exec-sh!"');
      console.log("Result:", result.trim());
      console.log("\n🚀 ~200K+ downloads/week on npm!");
    } catch (error) {
      console.error("Error:", error);
    }
  })();
}
