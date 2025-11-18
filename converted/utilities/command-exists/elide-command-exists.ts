/**
 * Command Exists - Check if Command Exists
 *
 * Check if a shell command exists.
 * **POLYGLOT SHOWCASE**: Command checking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/command-exists (~500K+ downloads/week)
 *
 * Features:
 * - Check command availability
 * - Cross-platform support
 * - Sync and async APIs
 * - Simple interface
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

import { execSync } from 'child_process';

export function commandExistsSync(command: string): boolean {
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? `where ${command}` : `which ${command}`;
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function commandExists(command: string): Promise<boolean> {
  return commandExistsSync(command);
}

export default commandExists;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✓ Command Exists - Check Commands (POLYGLOT!)\n");
  console.log("node exists:", commandExistsSync('node'));
  console.log("git exists:", commandExistsSync('git'));
  console.log("nonexistent exists:", commandExistsSync('nonexistent'));
  console.log("\n🚀 ~500K+ downloads/week on npm!");
}
