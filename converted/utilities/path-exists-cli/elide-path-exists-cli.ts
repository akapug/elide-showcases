/**
 * path-exists-cli - CLI Tool to Check if Path Exists
 *
 * Command-line tool to check if a path exists.
 * **POLYGLOT SHOWCASE**: One CLI tool for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/path-exists-cli (~50K+ downloads/week)
 *
 * Features:
 * - CLI to check path existence
 * - Exit code 0 if exists, 1 if not
 * - Multiple path support
 * - Simple interface
 * - Zero dependencies
 */

const fsPromises = await import('node:fs/promises');

export async function pathExists(path: string): Promise<boolean> {
  try {
    await fsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function checkPaths(paths: string[]): Promise<void> {
  for (const path of paths) {
    const exists = await pathExists(path);
    console.log(`${path}: ${exists ? '✓ exists' : '✗ does not exist'}`);
    if (!exists) {
      process.exit(1);
    }
  }
}

if (import.meta.url.includes("elide-path-exists-cli.ts")) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: path-exists-cli <path> [path2] [path3] ...");
    console.log("\nChecks if the specified paths exist.");
    console.log("Exit code 0 if all exist, 1 if any do not exist.");
    console.log("\nExamples:");
    console.log("  path-exists-cli package.json");
    console.log("  path-exists-cli src/ dist/ node_modules/");
    process.exit(0);
  }

  await checkPaths(args);
  console.log("\n✓ All paths exist");
  process.exit(0);
}

export default pathExists;
