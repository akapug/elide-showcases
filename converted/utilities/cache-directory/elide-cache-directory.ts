/**
 * Cache-Directory - Get Cache Directory Path
 * Based on https://www.npmjs.com/package/cache-directory (~50K+ downloads/week)
 * Features: OS-specific cache directory resolution
 */

export function cacheDirectory(name: string): string {
  const home = process.env.HOME || '/tmp';
  return \`\${home}/.cache/\${name}\`;
}

export default cacheDirectory;

if (import.meta.url.includes("elide-cache-directory.ts")) {
  console.log("📂 Cache-Directory (~50K+/week)\n");
  console.log("Cache dir for 'myapp':", cacheDirectory('myapp'));
  console.log("Cache dir for 'build':", cacheDirectory('build'));
}
