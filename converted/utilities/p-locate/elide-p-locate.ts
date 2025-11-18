/**
 * p-locate - Locate a File with Promise Support
 *
 * Get the first path that exists by checking multiple paths in order.
 * **POLYGLOT SHOWCASE**: One file locator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/p-locate (~10M+ downloads/week)
 *
 * Features:
 * - Find first existing path
 * - Promise-based async API
 * - Concurrent checking
 * - Custom tester function
 * - Zero dependencies
 */

const fsPromises = await import('node:fs/promises');

export interface PLocateOptions {
  concurrency?: number;
  preserveOrder?: boolean;
}

export async function pLocate<T>(
  input: Iterable<T>,
  tester: (value: T) => Promise<boolean> | boolean,
  options: PLocateOptions = {}
): Promise<T | undefined> {
  const { concurrency = Infinity, preserveOrder = true } = options;

  const values = [...input];

  if (preserveOrder) {
    for (const value of values) {
      if (await tester(value)) {
        return value;
      }
    }
    return undefined;
  }

  // Concurrent checking
  const promises = values.map(async (value) => {
    if (await tester(value)) {
      return value;
    }
    return undefined;
  });

  const results = await Promise.all(promises);
  return results.find(result => result !== undefined);
}

// Helper: locate existing file
export async function locateFile(paths: string[]): Promise<string | undefined> {
  return pLocate(paths, async (path) => {
    try {
      await fsPromises.access(path);
      return true;
    } catch {
      return false;
    }
  });
}

export default pLocate;

if (import.meta.url.includes("elide-p-locate.ts")) {
  console.log("🔍 p-locate - Locate Files with Promises (POLYGLOT!)\n");

  console.log("=== Example 1: Locate Existing File ===");
  const configPaths = [
    '.config.json',
    'config.json',
    '/tmp/config.json',
    '/etc/config.json'
  ];
  const found = await locateFile(configPaths);
  console.log("Looking for config in:", configPaths);
  console.log("Found:", found || "none");
  console.log();

  console.log("=== Example 2: Custom Tester ===");
  const numbers = [1, 2, 3, 4, 5];
  const firstEven = await pLocate(numbers, async (n) => n % 2 === 0);
  console.log("First even number:", firstEven);
  console.log();

  console.log("=== Example 3: Locate Common Config Files ===");
  const commonConfigs = [
    'package.json',
    'tsconfig.json',
    '.gitignore',
    'README.md'
  ];
  const foundConfig = await locateFile(commonConfigs);
  console.log("Found config:", foundConfig);
  console.log();

  console.log("🚀 Performance: ~10M+ downloads/week on npm!");
}
