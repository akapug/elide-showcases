/**
 * Package Installer
 *
 * Handles downloading, extracting, and installing packages from multiple ecosystems.
 * Includes cache management, install scripts, and symlink creation.
 */

import { ensureDir } from "jsr:@std/fs@1.0.0/ensure-dir";
import { exists } from "jsr:@std/fs@1.0.0/exists";
import * as path from "jsr:@std/path@1.0.0";
import { RegistryClient } from "./registry.ts";
import type { Package } from "./resolver.ts";

export interface InstallOptions {
  global?: boolean;
  dev?: boolean;
  verbose?: boolean;
  force?: boolean;
  skipScripts?: boolean;
}

export interface CacheEntry {
  package: string;
  version: string;
  ecosystem: string;
  path: string;
  timestamp: number;
  integrity: string;
}

export class Installer {
  private registry: RegistryClient;
  private cacheDir: string;
  private installDir: string;
  private globalDir: string;
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.registry = new RegistryClient();

    // Setup directories
    const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "/tmp";
    this.cacheDir = path.join(homeDir, ".elide", "cache");
    this.installDir = path.join(Deno.cwd(), "elide_modules");
    this.globalDir = path.join(homeDir, ".elide", "global");

    this.loadCache();
  }

  /**
   * Install a resolved package and its dependencies
   */
  async install(pkg: Package, options: InstallOptions = {}): Promise<void> {
    const targetDir = options.global ? this.globalDir : this.installDir;

    if (options.verbose) {
      console.log(`Installing ${pkg.name}@${pkg.version} to ${targetDir}`);
    }

    // Ensure directories exist
    await ensureDir(targetDir);
    await ensureDir(this.cacheDir);

    // Check cache first
    const cacheKey = `${pkg.ecosystem}:${pkg.name}@${pkg.version}`;
    const cached = this.cache.get(cacheKey);

    let packagePath: string;

    if (cached && await exists(cached.path) && !options.force) {
      if (options.verbose) {
        console.log(`Using cached version from ${cached.path}`);
      }
      packagePath = cached.path;
    } else {
      // Download package
      packagePath = await this.downloadPackage(pkg, options);

      // Update cache
      this.cache.set(cacheKey, {
        package: pkg.name,
        version: pkg.version,
        ecosystem: pkg.ecosystem,
        path: packagePath,
        timestamp: Date.now(),
        integrity: await this.calculateIntegrity(packagePath),
      });

      await this.saveCache();
    }

    // Extract/install package
    await this.extractPackage(packagePath, pkg, targetDir, options);

    // Install dependencies
    for (const dep of pkg.dependencies) {
      if (options.verbose) {
        console.log(`  Installing dependency ${dep.name}@${dep.version}`);
      }

      // Recursively install dependencies (simplified - should check if already installed)
      const depPkg: Package = {
        name: dep.name,
        version: dep.version,
        ecosystem: dep.ecosystem as any,
        dependencies: [],
      };

      await this.install(depPkg, { ...options, verbose: false });
    }

    // Run install scripts
    if (!options.skipScripts) {
      await this.runInstallScripts(pkg, targetDir, options);
    }

    // Create symlinks for executables
    await this.createSymlinks(pkg, targetDir, options);
  }

  /**
   * Install from lockfile entry
   */
  async installFromLock(lockEntry: any): Promise<void> {
    const pkg: Package = {
      name: lockEntry.name,
      version: lockEntry.version,
      ecosystem: lockEntry.ecosystem,
      dependencies: lockEntry.dependencies || [],
    };

    await this.install(pkg, { verbose: false });
  }

  /**
   * Uninstall a package
   */
  async uninstall(packageName: string, options: InstallOptions = {}): Promise<void> {
    const targetDir = options.global ? this.globalDir : this.installDir;
    const packagePath = path.join(targetDir, packageName);

    if (options.verbose) {
      console.log(`Removing ${packagePath}`);
    }

    if (await exists(packagePath)) {
      await Deno.remove(packagePath, { recursive: true });
    }

    // Remove from cache
    for (const [key, entry] of this.cache.entries()) {
      if (entry.package === packageName) {
        this.cache.delete(key);
      }
    }

    await this.saveCache();
  }

  /**
   * Update a package to a new version
   */
  async update(packageName: string, version: string, ecosystem: string): Promise<void> {
    console.log(`Updating ${packageName} to ${version}...`);

    // Uninstall old version
    await this.uninstall(packageName, { verbose: false });

    // Install new version
    const pkg: Package = {
      name: packageName,
      version,
      ecosystem: ecosystem as any,
      dependencies: [],
    };

    await this.install(pkg);
  }

  /**
   * Clean package cache
   */
  async cleanCache(): Promise<void> {
    console.log(`Cleaning cache directory: ${this.cacheDir}`);

    if (await exists(this.cacheDir)) {
      await Deno.remove(this.cacheDir, { recursive: true });
    }

    this.cache.clear();
    await ensureDir(this.cacheDir);
    await this.saveCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; packages: number; oldestEntry: number } {
    let size = 0;
    let oldestEntry = Date.now();

    for (const entry of this.cache.values()) {
      size++;
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
    }

    return {
      size,
      packages: this.cache.size,
      oldestEntry,
    };
  }

  /**
   * Download package from registry
   */
  private async downloadPackage(pkg: Package, options: InstallOptions): Promise<string> {
    const downloadUrl = await this.registry.getDownloadUrl(pkg.name, pkg.version, pkg.ecosystem);

    if (options.verbose) {
      console.log(`Downloading from ${downloadUrl}`);
    }

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Failed to download ${pkg.name}@${pkg.version}: ${response.statusText}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    // Save to cache
    const cacheFileName = `${pkg.ecosystem}-${pkg.name}-${pkg.version}${this.getFileExtension(pkg.ecosystem)}`;
    const cachePath = path.join(this.cacheDir, cacheFileName);

    await Deno.writeFile(cachePath, bytes);

    if (options.verbose) {
      console.log(`Cached to ${cachePath}`);
    }

    return cachePath;
  }

  /**
   * Extract/install package to target directory
   */
  private async extractPackage(
    packagePath: string,
    pkg: Package,
    targetDir: string,
    options: InstallOptions
  ): Promise<void> {
    const destPath = path.join(targetDir, pkg.name);

    await ensureDir(destPath);

    switch (pkg.ecosystem) {
      case "npm":
        await this.extractTarball(packagePath, destPath);
        break;
      case "pypi":
        await this.extractPythonPackage(packagePath, destPath);
        break;
      case "maven":
        await this.extractJar(packagePath, destPath);
        break;
      case "rubygems":
        await this.extractGem(packagePath, destPath);
        break;
    }

    if (options.verbose) {
      console.log(`Extracted to ${destPath}`);
    }
  }

  private async extractTarball(tarballPath: string, destPath: string): Promise<void> {
    // Extract tar.gz using tar command
    const process = new Deno.Command("tar", {
      args: ["-xzf", tarballPath, "-C", destPath, "--strip-components=1"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await process.output();

    if (code !== 0) {
      throw new Error(`Failed to extract tarball: ${tarballPath}`);
    }
  }

  private async extractPythonPackage(packagePath: string, destPath: string): Promise<void> {
    // Python packages can be .whl or .tar.gz
    if (packagePath.endsWith(".whl")) {
      // Wheel files are just zip archives
      await this.extractZip(packagePath, destPath);
    } else {
      await this.extractTarball(packagePath, destPath);
    }
  }

  private async extractJar(jarPath: string, destPath: string): Promise<void> {
    // JAR files are zip archives
    await this.extractZip(jarPath, destPath);
  }

  private async extractGem(gemPath: string, destPath: string): Promise<void> {
    // Gem files are tar archives
    const process = new Deno.Command("tar", {
      args: ["-xf", gemPath, "-C", destPath],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await process.output();

    if (code !== 0) {
      throw new Error(`Failed to extract gem: ${gemPath}`);
    }
  }

  private async extractZip(zipPath: string, destPath: string): Promise<void> {
    const process = new Deno.Command("unzip", {
      args: ["-q", zipPath, "-d", destPath],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await process.output();

    if (code !== 0) {
      throw new Error(`Failed to extract zip: ${zipPath}`);
    }
  }

  /**
   * Run post-install scripts
   */
  private async runInstallScripts(pkg: Package, targetDir: string, options: InstallOptions): Promise<void> {
    const packageDir = path.join(targetDir, pkg.name);

    switch (pkg.ecosystem) {
      case "npm": {
        const packageJsonPath = path.join(packageDir, "package.json");
        if (await exists(packageJsonPath)) {
          const packageJson = JSON.parse(await Deno.readTextFile(packageJsonPath));

          if (packageJson.scripts?.install) {
            if (options.verbose) {
              console.log(`Running install script for ${pkg.name}`);
            }
            await this.runScript(packageJson.scripts.install, packageDir);
          }
        }
        break;
      }
      case "pypi": {
        const setupPyPath = path.join(packageDir, "setup.py");
        if (await exists(setupPyPath)) {
          if (options.verbose) {
            console.log(`Running setup.py for ${pkg.name}`);
          }
          await this.runScript("python setup.py install", packageDir);
        }
        break;
      }
    }
  }

  private async runScript(script: string, cwd: string): Promise<void> {
    const process = new Deno.Command("sh", {
      args: ["-c", script],
      cwd,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await process.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`Script failed: ${errorText}`);
    }
  }

  /**
   * Create symlinks for executable binaries
   */
  private async createSymlinks(pkg: Package, targetDir: string, options: InstallOptions): Promise<void> {
    const packageDir = path.join(targetDir, pkg.name);
    const binDir = options.global
      ? path.join(this.globalDir, "bin")
      : path.join(targetDir, ".bin");

    await ensureDir(binDir);

    switch (pkg.ecosystem) {
      case "npm": {
        const packageJsonPath = path.join(packageDir, "package.json");
        if (await exists(packageJsonPath)) {
          const packageJson = JSON.parse(await Deno.readTextFile(packageJsonPath));

          if (packageJson.bin) {
            const bins = typeof packageJson.bin === "string"
              ? { [pkg.name]: packageJson.bin }
              : packageJson.bin;

            for (const [name, binPath] of Object.entries(bins)) {
              const source = path.join(packageDir, binPath as string);
              const target = path.join(binDir, name);

              try {
                await Deno.symlink(source, target);
                await Deno.chmod(source, 0o755);
              } catch {
                // Symlink might already exist
              }
            }
          }
        }
        break;
      }
    }
  }

  private getFileExtension(ecosystem: string): string {
    switch (ecosystem) {
      case "npm":
        return ".tgz";
      case "pypi":
        return ".whl";
      case "maven":
        return ".jar";
      case "rubygems":
        return ".gem";
      default:
        return "";
    }
  }

  private async calculateIntegrity(filePath: string): Promise<string> {
    const data = await Deno.readFile(filePath);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private async loadCache(): Promise<void> {
    const cachePath = path.join(this.cacheDir, "cache.json");

    try {
      if (await exists(cachePath)) {
        const data = await Deno.readTextFile(cachePath);
        const entries = JSON.parse(data);

        for (const entry of entries) {
          const key = `${entry.ecosystem}:${entry.package}@${entry.version}`;
          this.cache.set(key, entry);
        }
      }
    } catch (error) {
      console.warn(`Failed to load cache: ${error.message}`);
    }
  }

  private async saveCache(): Promise<void> {
    const cachePath = path.join(this.cacheDir, "cache.json");

    try {
      await ensureDir(this.cacheDir);

      const entries = Array.from(this.cache.values());
      await Deno.writeTextFile(cachePath, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.warn(`Failed to save cache: ${error.message}`);
    }
  }
}
