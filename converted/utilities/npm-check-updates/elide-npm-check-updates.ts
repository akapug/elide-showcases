/**
 * npm-check-updates - Update Package Dependencies
 *
 * Find newer versions of package dependencies and update package.json.
 * **POLYGLOT SHOWCASE**: Update checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/npm-check-updates (~300K+ downloads/week)
 *
 * Features:
 * - Check for latest versions
 * - Update package.json
 * - Filter by package
 * - Respect version ranges
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need dependency updates
 * - ONE tool works everywhere on Elide
 * - Consistent update strategy across languages
 * - Share update policies across your stack
 *
 * Use cases:
 * - Check for outdated packages
 * - Automated dependency updates
 * - Security vulnerability fixes
 * - Keep dependencies current
 *
 * Package has ~300K+ downloads/week on npm - essential maintenance tool!
 */

export interface PackageUpdate {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type: "dependencies" | "devDependencies" | "peerDependencies";
}

export interface UpdateOptions {
  upgrade?: boolean;
  target?: "latest" | "newest" | "greatest" | "minor" | "patch";
  filter?: string | RegExp;
  reject?: string | RegExp;
  interactive?: boolean;
}

/**
 * Parse version from string
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
  };
}

/**
 * Check if version is newer
 */
export function isNewer(current: string, target: string): boolean {
  const curr = parseVersion(current);
  const targ = parseVersion(target);

  if (!curr || !targ) return false;

  if (targ.major > curr.major) return true;
  if (targ.major < curr.major) return false;

  if (targ.minor > curr.minor) return true;
  if (targ.minor < curr.minor) return false;

  return targ.patch > curr.patch;
}

/**
 * Get target version based on strategy
 */
export function getTargetVersion(
  current: string,
  latest: string,
  target: string = "latest"
): string {
  const curr = parseVersion(current);
  const lat = parseVersion(latest);

  if (!curr || !lat) return latest;

  switch (target) {
    case "patch":
      // Only update patch version
      if (curr.major === lat.major && curr.minor === lat.minor) {
        return latest;
      }
      return current;

    case "minor":
      // Only update minor and patch
      if (curr.major === lat.major) {
        return latest;
      }
      return current;

    case "latest":
    case "greatest":
    default:
      return latest;
  }
}

/**
 * Check if package matches filter
 */
export function matchesFilter(packageName: string, filter?: string | RegExp): boolean {
  if (!filter) return true;

  if (typeof filter === "string") {
    return packageName.includes(filter);
  }

  return filter.test(packageName);
}

/**
 * Check for updates
 */
export async function checkUpdates(
  dependencies: Record<string, string>,
  registry: Record<string, string[]> = {},
  options: UpdateOptions = {}
): Promise<PackageUpdate[]> {
  const updates: PackageUpdate[] = [];

  for (const [name, current] of Object.entries(dependencies)) {
    // Apply filter
    if (options.filter && !matchesFilter(name, options.filter)) {
      continue;
    }
    if (options.reject && matchesFilter(name, options.reject)) {
      continue;
    }

    const cleanCurrent = current.replace(/^[\^~]/, "");
    const available = registry[name] || [];
    const latest = available[0] || cleanCurrent;

    if (isNewer(cleanCurrent, latest)) {
      const target = getTargetVersion(cleanCurrent, latest, options.target);
      updates.push({
        name,
        current,
        wanted: target,
        latest,
        type: "dependencies",
      });
    }
  }

  return updates;
}

/**
 * Update package.json with new versions
 */
export function updatePackageJson(
  packageJson: any,
  updates: PackageUpdate[]
): any {
  const updated = { ...packageJson };

  for (const update of updates) {
    if (updated.dependencies?.[update.name]) {
      const prefix = updated.dependencies[update.name].match(/^[\^~]/)?.[0] || "";
      updated.dependencies[update.name] = prefix + update.wanted;
    }
    if (updated.devDependencies?.[update.name]) {
      const prefix = updated.devDependencies[update.name].match(/^[\^~]/)?.[0] || "";
      updated.devDependencies[update.name] = prefix + update.wanted;
    }
  }

  return updated;
}

/**
 * Format update summary
 */
export function formatUpdateSummary(updates: PackageUpdate[]): string {
  let output = "";

  for (const update of updates) {
    const arrow = "→";
    output += `${update.name}: ${update.current} ${arrow} ${update.wanted}\n`;
  }

  return output;
}

/**
 * npm-check-updates runner
 */
export class NCU {
  private options: UpdateOptions;

  constructor(options: UpdateOptions = {}) {
    this.options = options;
  }

  /**
   * Run update check
   */
  async run(packageJson: any, registry: Record<string, string[]> = {}): Promise<PackageUpdate[]> {
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    const allDeps = { ...deps, ...devDeps };
    return await checkUpdates(allDeps, registry, this.options);
  }

  /**
   * Apply updates to package.json
   */
  apply(packageJson: any, updates: PackageUpdate[]): any {
    return updatePackageJson(packageJson, updates);
  }
}

export default NCU;

// CLI Demo
if (import.meta.url.includes("elide-npm-check-updates.ts")) {
  console.log("🔄 npm-check-updates - Dependency Updater for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Check for Updates ===");
  const deps = {
    react: "^17.0.0",
    lodash: "~4.17.20",
    express: "^4.17.0",
  };
  const registry = {
    react: ["18.2.0", "17.0.2", "16.14.0"],
    lodash: ["4.17.21", "4.17.20"],
    express: ["4.18.2", "4.17.3"],
  };
  const updates = await checkUpdates(deps, registry);
  console.log("Available updates:");
  for (const update of updates) {
    console.log(`  ${update.name}: ${update.current} → ${update.wanted}`);
  }
  console.log();

  console.log("=== Example 2: Target Strategies ===");
  const strategies = ["patch", "minor", "latest"];
  for (const strategy of strategies) {
    const target = getTargetVersion("4.17.0", "5.2.3", strategy);
    console.log(`  ${strategy}: 4.17.0 → ${target}`);
  }
  console.log();

  console.log("=== Example 3: Filter Packages ===");
  const filterOptions: UpdateOptions = {
    filter: "react",
  };
  const filtered = await checkUpdates(deps, registry, filterOptions);
  console.log("Filtered updates (react only):");
  for (const update of filtered) {
    console.log(`  ${update.name}: ${update.current} → ${update.wanted}`);
  }
  console.log();

  console.log("=== Example 4: Update package.json ===");
  const pkg = {
    name: "my-app",
    version: "1.0.0",
    dependencies: { ...deps },
  };
  const updated = updatePackageJson(pkg, updates);
  console.log("Updated dependencies:");
  console.log(JSON.stringify(updated.dependencies, null, 2));
  console.log();

  console.log("=== Example 5: NCU Runner ===");
  const ncu = new NCU({ target: "latest" });
  const allUpdates = await ncu.run(pkg, registry);
  console.log("All updates:");
  console.log(formatUpdateSummary(allUpdates));

  console.log("=== Example 6: Apply Updates ===");
  const finalPkg = ncu.apply(pkg, allUpdates);
  console.log("Final package.json:");
  console.log(JSON.stringify(finalPkg.dependencies, null, 2));
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same ncu interface works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Check updates across all languages");
  console.log("  ✓ Consistent update strategy");
  console.log("  ✓ Automated dependency maintenance");
  console.log("  ✓ Security vulnerability fixes");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Automated dependency updates");
  console.log("- Security patch management");
  console.log("- Keep dependencies current");
  console.log("- CI/CD update checks");
  console.log("- Bulk dependency upgrades");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- Fast update checking");
  console.log("- ~300K+ downloads/week on npm!");
}
