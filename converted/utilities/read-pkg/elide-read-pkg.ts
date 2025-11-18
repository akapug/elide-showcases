/**
 * read-pkg - Read package.json
 *
 * Read and parse package.json with normalization
 * Validates and normalizes package.json fields
 *
 * Popular package with ~80M downloads/week on npm!
 */

interface ReadPkgOptions {
  cwd?: string;
  normalize?: boolean;
}

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: any;
}

export async function readPkg(options: ReadPkgOptions = {}): Promise<PackageJson> {
  const { cwd = '.', normalize = true } = options;
  const pkgPath = `${cwd}/package.json`;

  try {
    const content = await Deno.readTextFile(pkgPath);
    let pkg = JSON.parse(content);

    if (normalize) {
      // Normalize fields
      if (pkg.name && typeof pkg.name === 'string') {
        pkg.name = pkg.name.toLowerCase();
      }
      if (pkg.version && typeof pkg.version === 'string') {
        pkg.version = pkg.version.trim();
      }
    }

    return pkg;
  } catch (error) {
    throw new Error(`Failed to read package.json at ${pkgPath}: ${error}`);
  }
}

export function readPkgSync(options: ReadPkgOptions = {}): PackageJson {
  const { cwd = '.', normalize = true } = options;
  const pkgPath = `${cwd}/package.json`;

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

    return pkg;
  } catch (error) {
    throw new Error(`Failed to read package.json at ${pkgPath}: ${error}`);
  }
}

// CLI Demo
if (import.meta.url.includes("elide-read-pkg.ts")) {
  console.log("📦 read-pkg - Read package.json for Elide\n");
  console.log('const pkg = await readPkg();');
  console.log('console.log(`${pkg.name}@${pkg.version}`);');
  console.log();
  console.log('const customPkg = await readPkg({ cwd: "./packages/foo" });');
  console.log();
  console.log("✅ Use Cases: Build tools, CLI tools, package management");
  console.log("🚀 ~80M downloads/week on npm");
}

export default readPkg;
export { readPkg, readPkgSync };
