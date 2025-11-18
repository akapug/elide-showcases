/**
 * write-pkg - Write package.json
 *
 * Write package.json with proper formatting
 * Preserves formatting and handles normalization
 *
 * Popular package with ~15M downloads/week on npm!
 */

interface WritePkgOptions {
  cwd?: string;
  normalize?: boolean;
  indent?: string | number;
}

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  [key: string]: any;
}

export async function writePkg(data: PackageJson, options: WritePkgOptions = {}): Promise<void> {
  const { cwd = '.', normalize = true, indent = 2 } = options;
  const pkgPath = `${cwd}/package.json`;

  let pkg = { ...data };

  if (normalize) {
    if (pkg.name && typeof pkg.name === 'string') {
      pkg.name = pkg.name.toLowerCase();
    }
    if (pkg.version && typeof pkg.version === 'string') {
      pkg.version = pkg.version.trim();
    }
  }

  const content = JSON.stringify(pkg, null, typeof indent === 'number' ? indent : indent) + '\n';
  await Deno.writeTextFile(pkgPath, content);
}

export function writePkgSync(data: PackageJson, options: WritePkgOptions = {}): void {
  const { cwd = '.', normalize = true, indent = 2 } = options;
  const pkgPath = `${cwd}/package.json`;

  let pkg = { ...data };

  if (normalize) {
    if (pkg.name && typeof pkg.name === 'string') {
      pkg.name = pkg.name.toLowerCase();
    }
    if (pkg.version && typeof pkg.version === 'string') {
      pkg.version = pkg.version.trim();
    }
  }

  const content = JSON.stringify(pkg, null, typeof indent === 'number' ? indent : indent) + '\n';
  Deno.writeTextFileSync(pkgPath, content);
}

// CLI Demo
if (import.meta.url.includes("elide-write-pkg.ts")) {
  console.log("📝 write-pkg - Write package.json for Elide\n");
  console.log('await writePkg({');
  console.log('  name: "my-package",');
  console.log('  version: "1.0.0",');
  console.log('  description: "My awesome package"');
  console.log('});');
  console.log();
  console.log('writePkgSync(pkg, { indent: 4 });');
  console.log();
  console.log("✅ Use Cases: Project scaffolding, package updates");
  console.log("🚀 ~15M downloads/week on npm");
}

export default writePkg;
export { writePkg, writePkgSync };
