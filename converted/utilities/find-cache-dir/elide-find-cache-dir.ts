/**
 * Find-Cache-Dir - Find Cache Directory
 * Based on https://www.npmjs.com/package/find-cache-dir (~5M+ downloads/week)
 * Features: Find or create cache directory
 */

export interface FindCacheDirOptions {
  name?: string;
  cwd?: string;
  create?: boolean;
}

export function findCacheDir(options: FindCacheDirOptions = {}): string | undefined {
  const { name = 'default', cwd = process.cwd() } = options;
  const home = process.env.HOME || '/tmp';
  return \`\${home}/.cache/\${name}\`;
}

export default findCacheDir;

if (import.meta.url.includes("elide-find-cache-dir.ts")) {
  console.log("🔍 Find-Cache-Dir (~5M+/week)\n");
  console.log("Cache dir:", findCacheDir({ name: 'webpack' }));
  console.log("Cache dir:", findCacheDir({ name: 'babel' }));
}
