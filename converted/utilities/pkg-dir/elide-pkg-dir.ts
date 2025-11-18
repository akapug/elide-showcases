/**
 * pkg-dir - Find Package Directory
 *
 * Find the root directory of an npm package
 * Walks up to find directory containing package.json
 *
 * Popular package with ~120M downloads/week on npm!
 */

export async function pkgDir(cwd: string = Deno.cwd()): Promise<string | undefined> {
  let currentDir = cwd.replace(/\/$/, '');

  while (true) {
    const pkgPath = `${currentDir}/package.json`;

    try {
      await Deno.stat(pkgPath);
      return currentDir;
    } catch {
      // package.json not found, move up
    }

    // Move to parent directory
    const parentDir = currentDir.substring(0, currentDir.lastIndexOf('/'));
    if (!parentDir || parentDir === currentDir) {
      return undefined; // Reached root
    }
    currentDir = parentDir;
  }
}

export function pkgDirSync(cwd: string = Deno.cwd()): string | undefined {
  let currentDir = cwd.replace(/\/$/, '');

  while (true) {
    const pkgPath = `${currentDir}/package.json`;

    try {
      Deno.statSync(pkgPath);
      return currentDir;
    } catch {
      // Not found
    }

    const parentDir = currentDir.substring(0, currentDir.lastIndexOf('/'));
    if (!parentDir || parentDir === currentDir) {
      return undefined;
    }
    currentDir = parentDir;
  }
}

// CLI Demo
if (import.meta.url.includes("elide-pkg-dir.ts")) {
  console.log("📂 pkg-dir - Find Package Directory for Elide\n");
  console.log('const rootDir = await pkgDir();');
  console.log('console.log("Package root:", rootDir);');
  console.log();
  console.log('const customDir = await pkgDir("/path/to/nested/dir");');
  console.log();
  console.log('const rootDirSync = pkgDirSync();');
  console.log();
  console.log("✅ Use Cases: Finding project root, config resolution");
  console.log("🚀 ~120M downloads/week on npm");
}

export default pkgDir;
export { pkgDir, pkgDirSync };
