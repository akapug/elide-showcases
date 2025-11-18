/**
 * npm-check - Check Package Status
 *
 * Check for outdated, incorrect, and unused dependencies.
 * **POLYGLOT SHOWCASE**: Package health checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/npm-check (~50K+ downloads/week)
 *
 * Features:
 * - Find outdated packages
 * - Detect unused dependencies
 * - Check for missing packages
 * - Interactive updates
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need dependency health checks
 * - ONE tool works everywhere on Elide
 * - Consistent health monitoring across languages
 * - Share dependency insights across your stack
 *
 * Use cases:
 * - Find unused dependencies
 * - Detect outdated packages
 * - Clean up package.json
 * - Optimize bundle size
 *
 * Package has ~50K+ downloads/week on npm - popular health checker!
 */

export interface PackageStatus {
  name: string;
  installed: string;
  latest: string;
  packageJson: string;
  isInstalled: boolean;
  isInPackageJson: boolean;
  isUsed: boolean;
  notInPackageJson: boolean;
  bump: string | null;
  unused: boolean;
  mismatch: boolean;
  missing: boolean;
}

export interface CheckOptions {
  update?: boolean;
  skipUnused?: boolean;
  ignoreDev?: boolean;
  production?: boolean;
}

/**
 * Compare versions and determine bump type
 */
export function determineBump(current: string, latest: string): string | null {
  const currMatch = current.match(/(\d+)\.(\d+)\.(\d+)/);
  const latMatch = latest.match(/(\d+)\.(\d+)\.(\d+)/);

  if (!currMatch || !latMatch) return null;

  const curr = {
    major: parseInt(currMatch[1]),
    minor: parseInt(currMatch[2]),
    patch: parseInt(currMatch[3]),
  };

  const lat = {
    major: parseInt(latMatch[1]),
    minor: parseInt(latMatch[2]),
    patch: parseInt(latMatch[3]),
  };

  if (lat.major > curr.major) return "major";
  if (lat.minor > curr.minor) return "minor";
  if (lat.patch > curr.patch) return "patch";

  return null;
}

/**
 * Check if package is used in source files (simplified)
 */
export function isPackageUsed(packageName: string, sourceFiles: string[]): boolean {
  const patterns = [
    `require('${packageName}')`,
    `require("${packageName}")`,
    `from '${packageName}'`,
    `from "${packageName}"`,
    `import ${packageName}`,
  ];

  for (const file of sourceFiles) {
    for (const pattern of patterns) {
      if (file.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check package status
 */
export function checkPackage(
  name: string,
  packageJsonVersion: string,
  installedVersion: string | null,
  latestVersion: string,
  isUsed: boolean
): PackageStatus {
  const isInstalled = installedVersion !== null;
  const mismatch = isInstalled && installedVersion !== packageJsonVersion.replace(/^[\^~]/, "");
  const missing = !isInstalled;
  const unused = isInstalled && !isUsed;

  const bump = isInstalled ? determineBump(installedVersion, latestVersion) : null;

  return {
    name,
    installed: installedVersion || "not installed",
    latest: latestVersion,
    packageJson: packageJsonVersion,
    isInstalled,
    isInPackageJson: true,
    isUsed,
    notInPackageJson: false,
    bump,
    unused,
    mismatch,
    missing,
  };
}

/**
 * Check all packages
 */
export async function checkPackages(
  packageJson: any,
  installed: Record<string, string>,
  registry: Record<string, string>,
  sourceFiles: string[] = [],
  options: CheckOptions = {}
): Promise<PackageStatus[]> {
  const results: PackageStatus[] = [];
  const allDeps = {
    ...(options.production ? {} : packageJson.devDependencies || {}),
    ...packageJson.dependencies || {},
  };

  for (const [name, version] of Object.entries(allDeps)) {
    const installedVer = installed[name] || null;
    const latestVer = registry[name] || version.replace(/^[\^~]/, "");
    const used = isPackageUsed(name, sourceFiles);

    const status = checkPackage(name, version as string, installedVer, latestVer, used);

    // Skip unused if requested
    if (options.skipUnused && status.unused) {
      continue;
    }

    results.push(status);
  }

  return results;
}

/**
 * Format check results
 */
export function formatResults(statuses: PackageStatus[]): string {
  let output = "";
  const outdated = statuses.filter((s) => s.bump);
  const unused = statuses.filter((s) => s.unused);
  const missing = statuses.filter((s) => s.missing);

  if (outdated.length > 0) {
    output += "Outdated packages:\n";
    for (const pkg of outdated) {
      output += `  ${pkg.name}: ${pkg.installed} → ${pkg.latest} (${pkg.bump})\n`;
    }
    output += "\n";
  }

  if (unused.length > 0) {
    output += "Unused packages:\n";
    for (const pkg of unused) {
      output += `  ${pkg.name}\n`;
    }
    output += "\n";
  }

  if (missing.length > 0) {
    output += "Missing packages:\n";
    for (const pkg of missing) {
      output += `  ${pkg.name}\n`;
    }
    output += "\n";
  }

  if (outdated.length === 0 && unused.length === 0 && missing.length === 0) {
    output = "All packages are up to date and used!\n";
  }

  return output;
}

/**
 * npm-check runner
 */
export class NpmCheck {
  private options: CheckOptions;

  constructor(options: CheckOptions = {}) {
    this.options = options;
  }

  /**
   * Run health check
   */
  async check(
    packageJson: any,
    installed: Record<string, string>,
    registry: Record<string, string>,
    sourceFiles: string[] = []
  ): Promise<PackageStatus[]> {
    return await checkPackages(packageJson, installed, registry, sourceFiles, this.options);
  }

  /**
   * Get summary
   */
  summary(statuses: PackageStatus[]): string {
    return formatResults(statuses);
  }
}

export default NpmCheck;

// CLI Demo
if (import.meta.url.includes("elide-npm-check.ts")) {
  console.log("🔍 npm-check - Package Health Checker for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Check Package Status ===");
  const status = checkPackage(
    "react",
    "^17.0.0",
    "17.0.2",
    "18.2.0",
    true
  );
  console.log("Package:", status.name);
  console.log("  Installed:", status.installed);
  console.log("  Latest:", status.latest);
  console.log("  Bump:", status.bump);
  console.log("  Used:", status.isUsed);
  console.log();

  console.log("=== Example 2: Determine Bump Type ===");
  const bumps = [
    { current: "1.0.0", latest: "2.0.0", expected: "major" },
    { current: "1.0.0", latest: "1.1.0", expected: "minor" },
    { current: "1.0.0", latest: "1.0.1", expected: "patch" },
  ];
  for (const { current, latest, expected } of bumps) {
    const bump = determineBump(current, latest);
    console.log(`  ${current} → ${latest}: ${bump} (expected: ${expected})`);
  }
  console.log();

  console.log("=== Example 3: Check Package Usage ===");
  const sourceCode = [
    "import React from 'react';",
    "const express = require('express');",
    "console.log('hello');",
  ];
  const packages = ["react", "express", "lodash"];
  for (const pkg of packages) {
    const used = isPackageUsed(pkg, sourceCode);
    console.log(`  ${pkg}: ${used ? "✓ Used" : "✗ Unused"}`);
  }
  console.log();

  console.log("=== Example 4: Check All Packages ===");
  const pkg = {
    dependencies: {
      react: "^17.0.0",
      lodash: "^4.17.20",
      axios: "^0.21.0",
    },
    devDependencies: {
      typescript: "^4.0.0",
    },
  };
  const installed = {
    react: "17.0.2",
    lodash: "4.17.21",
    axios: "0.21.1",
    typescript: "4.5.0",
  };
  const registry = {
    react: "18.2.0",
    lodash: "4.17.21",
    axios: "1.3.0",
    typescript: "5.0.0",
  };
  const sources = ["import React from 'react';", "import axios from 'axios';"];

  const results = await checkPackages(pkg, installed, registry, sources);
  console.log("Package health:");
  for (const result of results) {
    const status = result.unused ? "✗ Unused" : result.bump ? `⚠ ${result.bump}` : "✓ OK";
    console.log(`  ${result.name}: ${status}`);
  }
  console.log();

  console.log("=== Example 5: Format Results ===");
  console.log(formatResults(results));

  console.log("=== Example 6: npm-check Runner ===");
  const checker = new NpmCheck({ skipUnused: false });
  const allResults = await checker.check(pkg, installed, registry, sources);
  console.log(checker.summary(allResults));

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same npm-check interface works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Find unused dependencies");
  console.log("  ✓ Detect outdated packages");
  console.log("  ✓ Optimize bundle size");
  console.log("  ✓ Clean up package files");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Remove unused dependencies");
  console.log("- Find outdated packages");
  console.log("- Optimize bundle size");
  console.log("- Audit package health");
  console.log("- CI/CD health checks");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast health checks");
  console.log("- Instant execution on Elide");
  console.log("- ~50K+ downloads/week on npm!");
}
