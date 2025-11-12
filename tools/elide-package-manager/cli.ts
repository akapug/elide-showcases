#!/usr/bin/env elide
/**
 * Elide Package Manager CLI
 *
 * A polyglot package manager that works with npm, PyPI, Maven, and RubyGems.
 * Provides a unified interface for managing dependencies across multiple ecosystems.
 */

import { parseArgs } from "jsr:@std/cli@1.0.0/parse-args";
import { Installer } from "./installer.ts";
import { Resolver } from "./resolver.ts";
import { RegistryClient } from "./registry.ts";
import { LockManager } from "./lock-manager.ts";

const VERSION = "1.0.0";

interface PackageSpec {
  name: string;
  version?: string;
  ecosystem?: "npm" | "pypi" | "maven" | "rubygems";
}

class PackageManagerCLI {
  private installer: Installer;
  private resolver: Resolver;
  private registry: RegistryClient;
  private lockManager: LockManager;

  constructor() {
    this.installer = new Installer();
    this.resolver = new Resolver();
    this.registry = new RegistryClient();
    this.lockManager = new LockManager();
  }

  async run(args: string[]): Promise<void> {
    const parsed = parseArgs(args, {
      boolean: ["help", "version", "verbose", "dev", "save-dev", "global"],
      string: ["ecosystem", "registry"],
      alias: {
        h: "help",
        v: "version",
        V: "verbose",
        D: "save-dev",
        g: "global",
        e: "ecosystem",
      },
    });

    if (parsed.version) {
      console.log(`elide-package-manager v${VERSION}`);
      return;
    }

    const command = parsed._[0]?.toString();

    if (!command || parsed.help) {
      this.showHelp();
      return;
    }

    try {
      switch (command) {
        case "install":
        case "i":
          await this.install(parsed);
          break;
        case "uninstall":
        case "remove":
        case "rm":
          await this.uninstall(parsed);
          break;
        case "list":
        case "ls":
          await this.list(parsed);
          break;
        case "search":
          await this.search(parsed);
          break;
        case "update":
        case "upgrade":
          await this.update(parsed);
          break;
        case "init":
          await this.init(parsed);
          break;
        case "info":
          await this.info(parsed);
          break;
        case "outdated":
          await this.outdated(parsed);
          break;
        case "graph":
          await this.graph(parsed);
          break;
        case "clean":
          await this.clean(parsed);
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          Deno.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      if (parsed.verbose) {
        console.error(error.stack);
      }
      Deno.exit(1);
    }
  }

  private async install(parsed: any): Promise<void> {
    const packages = parsed._.slice(1).map((pkg: string) => this.parsePackageSpec(pkg.toString()));

    if (packages.length === 0) {
      console.log("Installing all dependencies from elide.json...");
      await this.installFromLockfile();
      return;
    }

    console.log(`Installing ${packages.length} package(s)...`);

    for (const pkg of packages) {
      console.log(`\n[${pkg.ecosystem || "auto"}] Installing ${pkg.name}${pkg.version ? `@${pkg.version}` : ""}...`);

      // Detect ecosystem if not specified
      if (!pkg.ecosystem) {
        pkg.ecosystem = await this.detectEcosystem(pkg.name);
      }

      // Resolve dependencies
      const resolved = await this.resolver.resolve(pkg.name, pkg.version, pkg.ecosystem);
      console.log(`Resolved ${resolved.dependencies.length} dependencies`);

      // Check for conflicts
      const conflicts = this.resolver.detectConflicts(resolved);
      if (conflicts.length > 0) {
        console.warn("Warning: Version conflicts detected:");
        for (const conflict of conflicts) {
          console.warn(`  ${conflict.package}: ${conflict.versions.join(", ")}`);
        }
      }

      // Install package and dependencies
      await this.installer.install(resolved, {
        global: parsed.global,
        dev: parsed["save-dev"],
        verbose: parsed.verbose,
      });

      // Update lockfile
      await this.lockManager.addPackage(pkg.name, resolved);

      console.log(`✓ Successfully installed ${pkg.name}`);
    }

    // Save lockfile
    await this.lockManager.save();
    console.log("\n✓ Installation complete!");
  }

  private async uninstall(parsed: any): Promise<void> {
    const packages = parsed._.slice(1).map((pkg: string) => pkg.toString());

    if (packages.length === 0) {
      console.error("Error: No packages specified");
      Deno.exit(1);
    }

    console.log(`Uninstalling ${packages.length} package(s)...`);

    for (const pkgName of packages) {
      console.log(`\nUninstalling ${pkgName}...`);

      // Check if package is a dependency of others
      const dependents = await this.resolver.findDependents(pkgName);
      if (dependents.length > 0) {
        console.warn(`Warning: ${pkgName} is required by:`);
        for (const dep of dependents) {
          console.warn(`  - ${dep}`);
        }
        // Continue anyway but warn
      }

      await this.installer.uninstall(pkgName, {
        global: parsed.global,
        verbose: parsed.verbose,
      });

      await this.lockManager.removePackage(pkgName);

      console.log(`✓ Successfully uninstalled ${pkgName}`);
    }

    await this.lockManager.save();
    console.log("\n✓ Uninstallation complete!");
  }

  private async list(parsed: any): Promise<void> {
    console.log("Installed packages:\n");

    const packages = await this.lockManager.listPackages();

    if (packages.length === 0) {
      console.log("No packages installed");
      return;
    }

    // Group by ecosystem
    const grouped: Record<string, typeof packages> = {};
    for (const pkg of packages) {
      if (!grouped[pkg.ecosystem]) {
        grouped[pkg.ecosystem] = [];
      }
      grouped[pkg.ecosystem].push(pkg);
    }

    for (const [ecosystem, pkgs] of Object.entries(grouped)) {
      console.log(`\n[${ecosystem.toUpperCase()}]`);
      for (const pkg of pkgs) {
        const tree = parsed.verbose ? ` (${pkg.dependencies?.length || 0} deps)` : "";
        console.log(`  ${pkg.name}@${pkg.version}${tree}`);

        if (parsed.verbose && pkg.dependencies && pkg.dependencies.length > 0) {
          for (const dep of pkg.dependencies) {
            console.log(`    └─ ${dep.name}@${dep.version}`);
          }
        }
      }
    }

    console.log(`\nTotal: ${packages.length} package(s)`);
  }

  private async search(parsed: any): Promise<void> {
    const query = parsed._.slice(1).join(" ");

    if (!query) {
      console.error("Error: No search query specified");
      Deno.exit(1);
    }

    console.log(`Searching for "${query}"...\n`);

    const ecosystems = parsed.ecosystem
      ? [parsed.ecosystem]
      : ["npm", "pypi", "maven", "rubygems"];

    const results = await this.registry.search(query, ecosystems);

    if (results.length === 0) {
      console.log("No results found");
      return;
    }

    for (const result of results) {
      console.log(`[${result.ecosystem}] ${result.name}@${result.version}`);
      if (result.description) {
        console.log(`  ${result.description}`);
      }
      if (parsed.verbose) {
        console.log(`  Downloads: ${result.downloads || "N/A"}`);
        console.log(`  Repository: ${result.repository || "N/A"}`);
      }
      console.log();
    }

    console.log(`Found ${results.length} result(s)`);
  }

  private async update(parsed: any): Promise<void> {
    console.log("Checking for updates...\n");

    const packages = await this.lockManager.listPackages();
    const updates: Array<{ name: string; current: string; latest: string; ecosystem: string }> = [];

    for (const pkg of packages) {
      const latest = await this.registry.getLatestVersion(pkg.name, pkg.ecosystem);
      if (latest && latest !== pkg.version) {
        updates.push({
          name: pkg.name,
          current: pkg.version,
          latest,
          ecosystem: pkg.ecosystem,
        });
      }
    }

    if (updates.length === 0) {
      console.log("All packages are up to date!");
      return;
    }

    console.log(`Found ${updates.length} update(s):\n`);
    for (const update of updates) {
      console.log(`[${update.ecosystem}] ${update.name}: ${update.current} → ${update.latest}`);
    }

    console.log("\nUpdating packages...");

    for (const update of updates) {
      await this.installer.update(update.name, update.latest, update.ecosystem);
      await this.lockManager.updatePackage(update.name, update.latest);
    }

    await this.lockManager.save();
    console.log("\n✓ All packages updated!");
  }

  private async init(parsed: any): Promise<void> {
    console.log("Initializing new Elide project...\n");

    const projectName = await this.prompt("Project name:", "my-elide-project");
    const version = await this.prompt("Version:", "1.0.0");
    const description = await this.prompt("Description:", "");
    const author = await this.prompt("Author:", "");

    const config = {
      name: projectName,
      version,
      description,
      author,
      dependencies: {},
      devDependencies: {},
      ecosystems: ["npm", "pypi", "maven", "rubygems"],
    };

    await Deno.writeTextFile("elide.json", JSON.stringify(config, null, 2));
    console.log("\n✓ Created elide.json");

    await this.lockManager.initialize();
    console.log("✓ Created elide.lock");

    console.log("\n✓ Project initialized!");
    console.log("\nNext steps:");
    console.log("  elide install <package>  - Install a package");
    console.log("  elide search <query>     - Search for packages");
  }

  private async info(parsed: any): Promise<void> {
    const packageName = parsed._[1]?.toString();

    if (!packageName) {
      console.error("Error: No package specified");
      Deno.exit(1);
    }

    console.log(`Fetching information for ${packageName}...\n`);

    const ecosystem = parsed.ecosystem || await this.detectEcosystem(packageName);
    const info = await this.registry.getPackageInfo(packageName, ecosystem);

    console.log(`[${info.ecosystem}] ${info.name}@${info.version}`);
    console.log(`\n${info.description || "No description available"}`);

    if (info.author) console.log(`\nAuthor: ${info.author}`);
    if (info.license) console.log(`License: ${info.license}`);
    if (info.repository) console.log(`Repository: ${info.repository}`);
    if (info.homepage) console.log(`Homepage: ${info.homepage}`);

    if (info.dependencies && Object.keys(info.dependencies).length > 0) {
      console.log(`\nDependencies (${Object.keys(info.dependencies).length}):`);
      for (const [dep, version] of Object.entries(info.dependencies)) {
        console.log(`  ${dep}: ${version}`);
      }
    }
  }

  private async outdated(parsed: any): Promise<void> {
    console.log("Checking for outdated packages...\n");

    const packages = await this.lockManager.listPackages();
    const outdated: Array<{ name: string; current: string; wanted: string; latest: string }> = [];

    for (const pkg of packages) {
      const latest = await this.registry.getLatestVersion(pkg.name, pkg.ecosystem);
      if (latest && latest !== pkg.version) {
        outdated.push({
          name: pkg.name,
          current: pkg.version,
          wanted: pkg.version, // TODO: Calculate based on semver range
          latest,
        });
      }
    }

    if (outdated.length === 0) {
      console.log("All packages are up to date!");
      return;
    }

    console.log(`Package        Current  Wanted  Latest`);
    console.log(`─────────────────────────────────────────`);
    for (const pkg of outdated) {
      console.log(`${pkg.name.padEnd(14)} ${pkg.current.padEnd(8)} ${pkg.wanted.padEnd(7)} ${pkg.latest}`);
    }
  }

  private async graph(parsed: any): Promise<void> {
    console.log("Generating dependency graph...\n");

    const packages = await this.lockManager.listPackages();
    const graph = this.resolver.buildGraph(packages);

    console.log(this.resolver.visualizeGraph(graph));

    // Detect circular dependencies
    const circular = this.resolver.detectCircular(graph);
    if (circular.length > 0) {
      console.log("\n⚠ Circular dependencies detected:");
      for (const cycle of circular) {
        console.log(`  ${cycle.join(" → ")}`);
      }
    }
  }

  private async clean(parsed: any): Promise<void> {
    console.log("Cleaning package cache...");

    await this.installer.cleanCache();

    console.log("✓ Cache cleaned successfully!");
  }

  private async installFromLockfile(): Promise<void> {
    const lockfile = await this.lockManager.load();

    if (!lockfile || Object.keys(lockfile.packages).length === 0) {
      console.log("No packages to install");
      return;
    }

    const packages = Object.entries(lockfile.packages);
    console.log(`Installing ${packages.length} package(s) from lockfile...`);

    for (const [name, pkg] of packages) {
      await this.installer.installFromLock(pkg);
      console.log(`✓ Installed ${name}@${pkg.version}`);
    }

    console.log("\n✓ All packages installed!");
  }

  private parsePackageSpec(spec: string): PackageSpec {
    // Format: [ecosystem:]package[@version]
    const ecosystemMatch = spec.match(/^(npm|pypi|maven|rubygems):/);
    const ecosystem = ecosystemMatch ? ecosystemMatch[1] as PackageSpec["ecosystem"] : undefined;

    const packagePart = ecosystem ? spec.slice(ecosystem.length + 1) : spec;
    const [name, version] = packagePart.split("@");

    return { name, version, ecosystem };
  }

  private async detectEcosystem(packageName: string): Promise<PackageSpec["ecosystem"]> {
    // Try to detect based on package name patterns and availability
    const checks = await Promise.all([
      this.registry.exists(packageName, "npm"),
      this.registry.exists(packageName, "pypi"),
      this.registry.exists(packageName, "maven"),
      this.registry.exists(packageName, "rubygems"),
    ]);

    if (checks[0]) return "npm";
    if (checks[1]) return "pypi";
    if (checks[2]) return "maven";
    if (checks[3]) return "rubygems";

    // Default to npm if not found
    return "npm";
  }

  private async prompt(message: string, defaultValue: string = ""): Promise<string> {
    const promptText = defaultValue ? `${message} (${defaultValue})` : message;
    console.log(promptText);

    const buf = new Uint8Array(1024);
    const n = await Deno.stdin.read(buf);
    const input = new TextDecoder().decode(buf.subarray(0, n || 0)).trim();

    return input || defaultValue;
  }

  private showHelp(): void {
    console.log(`
Elide Package Manager v${VERSION}

A polyglot package manager for npm, PyPI, Maven, and RubyGems.

USAGE:
  elide <command> [options]

COMMANDS:
  install, i [packages...]    Install packages
  uninstall, rm <packages>    Uninstall packages
  list, ls                    List installed packages
  search <query>              Search for packages
  update, upgrade             Update all packages
  init                        Initialize a new project
  info <package>              Show package information
  outdated                    Check for outdated packages
  graph                       Show dependency graph
  clean                       Clean package cache

OPTIONS:
  -h, --help                  Show this help message
  -v, --version               Show version number
  -V, --verbose               Verbose output
  -e, --ecosystem <type>      Specify ecosystem (npm|pypi|maven|rubygems)
  -D, --save-dev              Save as dev dependency
  -g, --global                Install globally

EXAMPLES:
  elide install express              Install from npm
  elide install pypi:requests        Install from PyPI
  elide install express@4.18.0       Install specific version
  elide search lodash                Search all ecosystems
  elide list --verbose               List with dependencies
  elide update                       Update all packages

For more information, visit: https://github.com/elide-dev
`);
  }
}

// Main entry point
if (import.meta.main) {
  const cli = new PackageManagerCLI();
  await cli.run(Deno.args);
}
