/**
 * Lockfile Manager
 *
 * Manages elide.lock for reproducible builds and dependency integrity.
 * Tracks exact versions, checksums, and dependency trees.
 */

import { exists } from "jsr:@std/fs@1.0.0/exists";
import type { Package } from "./resolver.ts";

export interface Lockfile {
  version: string;
  generated: string;
  packages: Record<string, LockPackage>;
  integrity: Record<string, string>;
}

export interface LockPackage {
  name: string;
  version: string;
  ecosystem: "npm" | "pypi" | "maven" | "rubygems";
  resolved: string;
  integrity: string;
  dependencies?: Record<string, string>;
  dev?: boolean;
}

export class LockManager {
  private lockfilePath = "elide.lock";
  private lockfile: Lockfile | null = null;

  /**
   * Initialize a new lockfile
   */
  async initialize(): Promise<void> {
    this.lockfile = {
      version: "1.0",
      generated: new Date().toISOString(),
      packages: {},
      integrity: {},
    };

    await this.save();
  }

  /**
   * Load existing lockfile
   */
  async load(): Promise<Lockfile | null> {
    if (!(await exists(this.lockfilePath))) {
      return null;
    }

    try {
      const content = await Deno.readTextFile(this.lockfilePath);
      this.lockfile = JSON.parse(content);
      return this.lockfile;
    } catch (error) {
      throw new Error(`Failed to load lockfile: ${error.message}`);
    }
  }

  /**
   * Save lockfile to disk
   */
  async save(): Promise<void> {
    if (!this.lockfile) {
      throw new Error("No lockfile to save");
    }

    this.lockfile.generated = new Date().toISOString();

    const content = JSON.stringify(this.lockfile, null, 2);
    await Deno.writeTextFile(this.lockfilePath, content);
  }

  /**
   * Add a package to the lockfile
   */
  async addPackage(name: string, pkg: Package): Promise<void> {
    if (!this.lockfile) {
      await this.load() || await this.initialize();
    }

    const key = `${pkg.ecosystem}:${name}@${pkg.version}`;

    // Calculate resolved URL and integrity
    const resolved = await this.getResolvedUrl(pkg);
    const integrity = await this.calculateIntegrity(pkg);

    this.lockfile!.packages[key] = {
      name,
      version: pkg.version,
      ecosystem: pkg.ecosystem,
      resolved,
      integrity,
      dependencies: this.convertDependencies(pkg.dependencies),
    };

    this.lockfile!.integrity[key] = integrity;
  }

  /**
   * Remove a package from the lockfile
   */
  async removePackage(name: string): Promise<void> {
    if (!this.lockfile) {
      await this.load();
      if (!this.lockfile) return;
    }

    // Find and remove all entries for this package
    for (const key of Object.keys(this.lockfile.packages)) {
      if (this.lockfile.packages[key].name === name) {
        delete this.lockfile.packages[key];
        delete this.lockfile.integrity[key];
      }
    }
  }

  /**
   * Update a package version in the lockfile
   */
  async updatePackage(name: string, version: string): Promise<void> {
    if (!this.lockfile) {
      await this.load();
      if (!this.lockfile) return;
    }

    // Find and update entries for this package
    for (const key of Object.keys(this.lockfile.packages)) {
      const pkg = this.lockfile.packages[key];
      if (pkg.name === name) {
        // Remove old entry
        delete this.lockfile.packages[key];
        delete this.lockfile.integrity[key];

        // Update version
        pkg.version = version;

        // Add with new key
        const newKey = `${pkg.ecosystem}:${name}@${version}`;
        this.lockfile.packages[newKey] = pkg;
      }
    }
  }

  /**
   * List all packages in the lockfile
   */
  async listPackages(): Promise<Package[]> {
    if (!this.lockfile) {
      await this.load();
      if (!this.lockfile) return [];
    }

    const packages: Package[] = [];

    for (const [, pkg] of Object.entries(this.lockfile.packages)) {
      packages.push({
        name: pkg.name,
        version: pkg.version,
        ecosystem: pkg.ecosystem,
        dependencies: this.convertLockDependencies(pkg.dependencies),
      });
    }

    return packages;
  }

  /**
   * Verify lockfile integrity
   */
  async verify(): Promise<{ valid: boolean; errors: string[] }> {
    if (!this.lockfile) {
      await this.load();
      if (!this.lockfile) {
        return { valid: false, errors: ["Lockfile not found"] };
      }
    }

    const errors: string[] = [];

    // Check all packages have integrity hashes
    for (const [key, pkg] of Object.entries(this.lockfile.packages)) {
      if (!this.lockfile.integrity[key]) {
        errors.push(`Missing integrity hash for ${key}`);
      }

      if (!pkg.resolved) {
        errors.push(`Missing resolved URL for ${key}`);
      }

      // Verify dependency references exist
      if (pkg.dependencies) {
        for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
          const depKey = `${pkg.ecosystem}:${depName}@${depVersion}`;
          if (!this.lockfile.packages[depKey]) {
            errors.push(`Missing dependency ${depKey} required by ${key}`);
          }
        }
      }
    }

    // Check for orphaned integrity entries
    for (const key of Object.keys(this.lockfile.integrity)) {
      if (!this.lockfile.packages[key]) {
        errors.push(`Orphaned integrity hash for ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get package from lockfile
   */
  getPackage(name: string, version?: string): LockPackage | null {
    if (!this.lockfile) return null;

    for (const [key, pkg] of Object.entries(this.lockfile.packages)) {
      if (pkg.name === name && (!version || pkg.version === version)) {
        return pkg;
      }
    }

    return null;
  }

  /**
   * Check if lockfile has changes
   */
  hasChanges(): boolean {
    // Compare current state with file on disk
    // This is simplified - a real implementation would do a deep comparison
    return true;
  }

  /**
   * Get lockfile statistics
   */
  getStats(): {
    totalPackages: number;
    byEcosystem: Record<string, number>;
    lastGenerated: string;
  } {
    if (!this.lockfile) {
      return {
        totalPackages: 0,
        byEcosystem: {},
        lastGenerated: "",
      };
    }

    const byEcosystem: Record<string, number> = {};

    for (const pkg of Object.values(this.lockfile.packages)) {
      byEcosystem[pkg.ecosystem] = (byEcosystem[pkg.ecosystem] || 0) + 1;
    }

    return {
      totalPackages: Object.keys(this.lockfile.packages).length,
      byEcosystem,
      lastGenerated: this.lockfile.generated,
    };
  }

  /**
   * Merge another lockfile into this one
   */
  async merge(otherLockfile: Lockfile): Promise<void> {
    if (!this.lockfile) {
      this.lockfile = otherLockfile;
      return;
    }

    // Merge packages
    for (const [key, pkg] of Object.entries(otherLockfile.packages)) {
      if (!this.lockfile.packages[key]) {
        this.lockfile.packages[key] = pkg;
      }
    }

    // Merge integrity hashes
    for (const [key, hash] of Object.entries(otherLockfile.integrity)) {
      if (!this.lockfile.integrity[key]) {
        this.lockfile.integrity[key] = hash;
      }
    }
  }

  /**
   * Prune unused packages from lockfile
   */
  async prune(usedPackages: Set<string>): Promise<number> {
    if (!this.lockfile) return 0;

    let pruned = 0;

    for (const key of Object.keys(this.lockfile.packages)) {
      const pkg = this.lockfile.packages[key];
      const pkgId = `${pkg.ecosystem}:${pkg.name}`;

      if (!usedPackages.has(pkgId)) {
        delete this.lockfile.packages[key];
        delete this.lockfile.integrity[key];
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Export lockfile to different format
   */
  export(format: "json" | "yaml" | "toml"): string {
    if (!this.lockfile) {
      throw new Error("No lockfile loaded");
    }

    switch (format) {
      case "json":
        return JSON.stringify(this.lockfile, null, 2);
      case "yaml":
        return this.toYaml(this.lockfile);
      case "toml":
        return this.toToml(this.lockfile);
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  private async getResolvedUrl(pkg: Package): Promise<string> {
    // This would get the actual download URL from the registry
    // For now, return a placeholder
    return `https://registry.example.com/${pkg.ecosystem}/${pkg.name}/${pkg.version}`;
  }

  private async calculateIntegrity(pkg: Package): Promise<string> {
    // Calculate SHA-256 hash of package contents
    // For now, return a placeholder
    const data = `${pkg.ecosystem}:${pkg.name}@${pkg.version}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "sha256-" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private convertDependencies(dependencies: any[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (const dep of dependencies) {
      result[dep.name] = dep.version;
    }

    return result;
  }

  private convertLockDependencies(dependencies?: Record<string, string>): any[] {
    if (!dependencies) return [];

    return Object.entries(dependencies).map(([name, version]) => ({
      name,
      version,
      ecosystem: "npm", // Default - should be determined properly
    }));
  }

  private toYaml(obj: any, indent: number = 0): string {
    const spaces = "  ".repeat(indent);
    let yaml = "";

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.toYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          yaml += `${spaces}  - ${item}\n`;
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  private toToml(obj: any): string {
    // Simplified TOML conversion
    let toml = "";

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        toml += `[${key}]\n`;
        for (const [subKey, subValue] of Object.entries(value)) {
          toml += `${subKey} = ${JSON.stringify(subValue)}\n`;
        }
        toml += "\n";
      } else {
        toml += `${key} = ${JSON.stringify(value)}\n`;
      }
    }

    return toml;
  }
}
