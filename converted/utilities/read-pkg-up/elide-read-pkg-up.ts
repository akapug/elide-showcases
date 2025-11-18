/**
 * read-pkg-up - Read Closest package.json
 *
 * Read package.json walking up parent directories
 * Combines find-up and read-pkg functionality
 *
 * Popular package with ~80M downloads/week on npm!
 */

interface ReadPkgUpOptions {
  cwd?: string;
  normalize?: boolean;
}

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  [key: string]: any;
}

interface ReadPkgUpResult {
  packageJson: PackageJson;
  path: string;
}

export async function readPkgUp(options: ReadPkgUpOptions = {}): Promise<ReadPkgUpResult | undefined> {
  let { cwd = Deno.cwd(), normalize = true } = options;
  let currentDir = cwd.replace(/\/$/, '');

  while (true) {
    const pkgPath = `${currentDir}/package.json`;

    try {
      const content = await Deno.readTextFile(pkgPath);
      let pkg = JSON.parse(content);

      if (normalize) {
        if (pkg.name && typeof pkg.name === 'string') {
          pkg.name = pkg.name.toLowerCase();
        }
        if (pkg.version && typeof pkg.version === 'string') {
          pkg.version = pkg.version.trim();
        }
      }

      return {
        packageJson: pkg,
        path: pkgPath,
      };
    } catch {
      // Not found, continue
    }

    // Move to parent directory
    const parentDir = currentDir.substring(0, currentDir.lastIndexOf('/'));
    if (!parentDir || parentDir === currentDir) {
      return undefined; // Reached root
    }
    currentDir = parentDir;
  }
}

export function readPkgUpSync(options: ReadPkgUpOptions = {}): ReadPkgUpResult | undefined {
  let { cwd = Deno.cwd(), normalize = true } = options;
  let currentDir = cwd.replace(/\/$/, '');

  while (true) {
    const pkgPath = `${currentDir}/package.json`;

    try {
      const content = Deno.readTextFileSync(pkgPath);
      let pkg = JSON.parse(content);

      if (normalize) {
        if (pkg.name && typeof pkg.name === 'string') {
          pkg.name = pkg.name.toLowerCase();
        }
        if (pkg.version && typeof pkg.version === 'string') {
          pkg.version = pkg.version.trim();
        }
      }

      return {
        packageJson: pkg,
        path: pkgPath,
      };
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
if (import.meta.url.includes("elide-read-pkg-up.ts")) {
  console.log("📦 read-pkg-up - Read Closest package.json for Elide\n");
  console.log('const result = await readPkgUp();');
  console.log('if (result) {');
  console.log('  console.log("Found:", result.path);');
  console.log('  console.log("Package:", result.packageJson.name);');
  console.log('}');
  console.log();
  console.log('const custom = await readPkgUp({ cwd: "./nested/dir" });');
  console.log();
  console.log("✅ Use Cases: Finding project package.json, CLI tools");
  console.log("🚀 ~80M downloads/week on npm");
}

export default readPkgUp;
export { readPkgUp, readPkgUpSync };
