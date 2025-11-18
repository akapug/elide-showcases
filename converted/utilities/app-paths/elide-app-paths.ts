/**
 * app-paths - Application Configuration Paths
 *
 * Get application-specific paths for config, data, logs, cache.
 * **POLYGLOT SHOWCASE**: One path utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/app-paths (~50K+ downloads/week)
 *
 * Features:
 * - Platform-specific application directories
 * - Config, data, cache, log paths
 * - macOS, Windows, Linux support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need app paths
 * - ONE implementation works everywhere on Elide
 * - Consistent directory structure across languages
 * - Platform-aware path resolution
 *
 * Package has ~50K+ downloads/week on npm!
 */

import * as os from 'os';
import * as path from 'path';

export interface AppPaths {
  config: string;
  data: string;
  cache: string;
  log: string;
  temp: string;
}

export function appPaths(appName: string): AppPaths {
  const home = os.homedir();
  const platform = os.platform();
  
  let configDir: string;
  let dataDir: string;
  let cacheDir: string;
  let logDir: string;
  let tempDir: string;
  
  if (platform === 'darwin') {
    configDir = path.join(home, 'Library', 'Preferences', appName);
    dataDir = path.join(home, 'Library', 'Application Support', appName);
    cacheDir = path.join(home, 'Library', 'Caches', appName);
    logDir = path.join(home, 'Library', 'Logs', appName);
    tempDir = path.join(os.tmpdir(), appName);
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    configDir = path.join(appData, appName, 'Config');
    dataDir = path.join(appData, appName, 'Data');
    cacheDir = path.join(localAppData, appName, 'Cache');
    logDir = path.join(localAppData, appName, 'Logs');
    tempDir = path.join(os.tmpdir(), appName);
  } else {
    configDir = path.join(home, '.config', appName);
    dataDir = path.join(home, '.local', 'share', appName);
    cacheDir = path.join(home, '.cache', appName);
    logDir = path.join(home, '.local', 'log', appName);
    tempDir = path.join(os.tmpdir(), appName);
  }
  
  return {
    config: configDir,
    data: dataDir,
    cache: cacheDir,
    log: logDir,
    temp: tempDir
  };
}

export default appPaths;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📁 app-paths - Application Paths (POLYGLOT!)\n");
  
  const paths = appPaths('my-awesome-app');
  console.log("=== Application Directories ===");
  console.log(`Config: ${paths.config}`);
  console.log(`Data:   ${paths.data}`);
  console.log(`Cache:  ${paths.cache}`);
  console.log(`Log:    ${paths.log}`);
  console.log(`Temp:   ${paths.temp}`);
  console.log();
  
  console.log("✅ Use Cases: App config, User data, Cache, Logs");
  console.log("🚀 50K+ npm downloads/week - Polyglot-ready");
}
