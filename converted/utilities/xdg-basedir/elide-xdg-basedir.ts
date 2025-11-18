/**
 * xdg-basedir - XDG Base Directory Specification
 *
 * Get XDG Base Directory paths for config, data, cache, etc.
 * **POLYGLOT SHOWCASE**: One directory spec for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/xdg-basedir (~1M+ downloads/week)
 *
 * Features:
 * - XDG Base Directory Specification compliance
 * - Config, data, cache, runtime directories
 * - Cross-platform defaults
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need standard paths
 * - ONE implementation works everywhere on Elide
 * - Consistent directory structure across languages
 * - Share configuration locations across your stack
 *
 * Use cases:
 * - Application configuration storage
 * - User data directories
 * - Cache management
 * - Runtime files and sockets
 *
 * Package has ~1M+ downloads/week on npm!
 */

import * as os from 'os';
import * as path from 'path';

function getEnvPath(envVar: string, defaultPath: string): string {
  return process.env[envVar] || path.join(os.homedir(), defaultPath);
}

export const config = getEnvPath('XDG_CONFIG_HOME', '.config');
export const data = getEnvPath('XDG_DATA_HOME', '.local/share');
export const cache = getEnvPath('XDG_CACHE_HOME', '.cache');
export const runtime = process.env.XDG_RUNTIME_DIR || path.join(os.tmpdir(), `run-${process.getuid?.() || 'user'}`);

export const configDirs = (process.env.XDG_CONFIG_DIRS || '/etc/xdg').split(':');
export const dataDirs = (process.env.XDG_DATA_DIRS || '/usr/local/share:/usr/share').split(':');

export default { config, data, cache, runtime, configDirs, dataDirs };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📁 xdg-basedir - XDG Base Directory Spec (POLYGLOT!)\n");
  
  console.log("=== XDG Base Directories ===");
  console.log(`Config:  ${config}`);
  console.log(`Data:    ${data}`);
  console.log(`Cache:   ${cache}`);
  console.log(`Runtime: ${runtime}`);
  console.log();
  
  console.log("=== System Directories ===");
  console.log(`Config dirs: ${configDirs.join(', ')}`);
  console.log(`Data dirs:   ${dataDirs.join(', ')}`);
  console.log();
  
  console.log("✅ Use Cases: App config, User data, Cache storage");
  console.log("🚀 1M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}
