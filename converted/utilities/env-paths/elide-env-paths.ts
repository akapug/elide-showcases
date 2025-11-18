/**
 * Env Paths - Get OS-Specific Paths
 *
 * Get paths for config, data, cache, etc.
 * **POLYGLOT SHOWCASE**: Path management for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/env-paths (~10M+ downloads/week)
 *
 * Features:
 * - OS-specific paths
 * - Config/data/cache directories
 * - Cross-platform support
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~10M+ downloads/week on npm!
 */

import * as os from 'os';
import * as path from 'path';

export interface EnvPaths {
  data: string;
  config: string;
  cache: string;
  log: string;
  temp: string;
}

export function envPaths(name: string, options?: { suffix?: string }): EnvPaths {
  const homedir = os.homedir();
  const platform = process.platform;
  const suffix = options?.suffix || '';

  if (platform === 'darwin') {
    const library = path.join(homedir, 'Library');
    return {
      data: path.join(library, 'Application Support', name + suffix),
      config: path.join(library, 'Preferences', name + suffix),
      cache: path.join(library, 'Caches', name + suffix),
      log: path.join(library, 'Logs', name + suffix),
      temp: path.join(os.tmpdir(), name + suffix),
    };
  }

  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(homedir, 'AppData', 'Local');
    return {
      data: path.join(localAppData, name + suffix, 'Data'),
      config: path.join(appData, name + suffix, 'Config'),
      cache: path.join(localAppData, name + suffix, 'Cache'),
      log: path.join(localAppData, name + suffix, 'Log'),
      temp: path.join(os.tmpdir(), name + suffix),
    };
  }

  // Linux/Unix
  const dataHome = process.env.XDG_DATA_HOME || path.join(homedir, '.local', 'share');
  const configHome = process.env.XDG_CONFIG_HOME || path.join(homedir, '.config');
  const cacheHome = process.env.XDG_CACHE_HOME || path.join(homedir, '.cache');

  return {
    data: path.join(dataHome, name + suffix),
    config: path.join(configHome, name + suffix),
    cache: path.join(cacheHome, name + suffix),
    log: path.join(cacheHome, name + suffix, 'log'),
    temp: path.join(os.tmpdir(), name + suffix),
  };
}

export default envPaths;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📁 Env Paths - OS-Specific Paths (POLYGLOT!)\n");

  const paths = envPaths('elide-app');

  console.log("Data:", paths.data);
  console.log("Config:", paths.config);
  console.log("Cache:", paths.cache);
  console.log("Log:", paths.log);
  console.log("Temp:", paths.temp);

  console.log("\n🚀 ~10M+ downloads/week on npm!");
}
