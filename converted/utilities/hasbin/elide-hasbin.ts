/**
 * Hasbin - Check Binary Availability
 *
 * Check if a binary exists in PATH.
 * **POLYGLOT SHOWCASE**: Binary checking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hasbin (~100K+ downloads/week)
 *
 * Features:
 * - Check binary availability
 * - PATH searching
 * - Sync and async APIs
 * - Simple interface
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

import { execSync } from 'child_process';

export function hasbinSync(binary: string): boolean {
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? `where ${binary}` : `which ${binary}`;
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function hasbin(binary: string): Promise<boolean> {
  return hasbinSync(binary);
}

export default hasbin;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 Hasbin - Check Binaries (POLYGLOT!)\n");
  console.log("node:", hasbinSync('node'));
  console.log("python:", hasbinSync('python'));
  console.log("nonexistent:", hasbinSync('nonexistent'));
  console.log("\n🚀 ~100K+ downloads/week on npm!");
}
