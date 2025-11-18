/**
 * Which - Locate Commands in PATH
 *
 * Find the location of executable commands.
 * **POLYGLOT SHOWCASE**: Command location for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/which (~10M+ downloads/week)
 *
 * Features:
 * - Find command paths
 * - Cross-platform support
 * - Sync and async APIs
 * - PATH searching
 * - Zero dependencies
 *
 * Package has ~10M+ downloads/week on npm!
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export function whichSync(command: string): string | null {
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? `where ${command}` : `which ${command}`;
    const result = execSync(cmd, { encoding: 'utf8' });
    return result.trim().split('\n')[0];
  } catch {
    return null;
  }
}

export async function which(command: string): Promise<string | null> {
  return whichSync(command);
}

export default which;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📍 Which - Locate Commands (POLYGLOT!)\n");
  console.log("node:", whichSync('node'));
  console.log("npm:", whichSync('npm'));
  console.log("git:", whichSync('git'));
  console.log("\n🚀 ~10M+ downloads/week on npm!");
}
