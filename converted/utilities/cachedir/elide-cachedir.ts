/**
 * Cachedir - Get Cache Directory
 * Based on https://www.npmjs.com/package/cachedir (~500K+ downloads/week)
 * Features: Cross-platform cache directory
 */

export function cachedir(name: string): string {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE || '/tmp';
  
  if (platform === 'darwin') {
    return \`\${home}/Library/Caches/\${name}\`;
  }
  
  if (platform === 'win32') {
    return \`\${process.env.LOCALAPPDATA || home}\\\\Cache\\\\\${name}\`;
  }
  
  return \`\${home}/.cache/\${name}\`;
}

export default cachedir;

if (import.meta.url.includes("elide-cachedir.ts")) {
  console.log("📁 Cachedir (~500K+/week)\n");
  console.log("Platform:", process.platform);
  console.log("Cache dir for 'myapp':", cachedir('myapp'));
  console.log("Cache dir for 'npm':", cachedir('npm'));
}
