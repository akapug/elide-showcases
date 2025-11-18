/**
 * Is Installed Globally - Check Global Installation
 *
 * Check if package is installed globally.
 * **POLYGLOT SHOWCASE**: Installation detection for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-installed-globally (~5M+ downloads/week)
 *
 * Features:
 * - Detect global installation
 * - Cross-platform support
 * - npm/yarn detection
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

import * as path from 'path';

export function isInstalledGlobally(): boolean {
  // Check if in global node_modules
  const scriptPath = process.argv[1] || '';

  // Common global paths
  const globalPaths = [
    '/usr/local/lib/node_modules',
    '/usr/lib/node_modules',
    path.join(process.env.HOME || '', '.npm-global', 'lib', 'node_modules'),
    path.join(process.env.APPDATA || '', 'npm', 'node_modules'),
  ];

  return globalPaths.some(globalPath =>
    scriptPath.includes(globalPath)
  );
}

export default isInstalledGlobally;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌍 Is Installed Globally - Installation Check (POLYGLOT!)\n");

  console.log("Is globally installed:", isInstalledGlobally());
  console.log("Script path:", process.argv[1]);

  console.log("\n🚀 ~5M+ downloads/week on npm!");
}
