/**
 * Module Resolver
 *
 * Resolves module paths using various strategies:
 * - Node.js resolution algorithm
 * - Browser field resolution
 * - TypeScript path mapping
 * - Custom alias configuration
 * - Package.json exports field
 */

import * as path from "path";
import * as fs from "fs";

export interface ResolverOptions {
  extensions?: string[];
  mainFields?: string[];
  mainFiles?: string[];
  modules?: string[];
  alias?: Record<string, string>;
  tsConfigPath?: string;
  conditionNames?: string[];
  exportsFieldKey?: string[];
}

export interface ResolveResult {
  path: string;
  external: boolean;
  sideEffects: boolean;
  type?: "module" | "commonjs";
}

export class ModuleResolver {
  private options: Required<ResolverOptions>;
  private cache: Map<string, ResolveResult> = new Map();
  private tsPathMappings: Map<string, string[]> = new Map();

  constructor(options: ResolverOptions = {}) {
    this.options = {
      extensions: options.extensions || [".ts", ".tsx", ".js", ".jsx", ".json", ".mjs", ".cjs"],
      mainFields: options.mainFields || ["module", "jsnext:main", "main"],
      mainFiles: options.mainFiles || ["index"],
      modules: options.modules || ["node_modules"],
      alias: options.alias || {},
      tsConfigPath: options.tsConfigPath || "",
      conditionNames: options.conditionNames || ["import", "require", "default"],
      exportsFieldKey: options.exportsFieldKey || ["import", "require", "default"],
    };

    // Load TypeScript path mappings if tsconfig exists
    if (this.options.tsConfigPath) {
      this.loadTsPathMappings(this.options.tsConfigPath);
    }
  }

  /**
   * Resolve a module import
   */
  resolve(specifier: string, importer: string): ResolveResult | null {
    const cacheKey = `${specifier}::${importer}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let result: ResolveResult | null = null;

    // 1. Check if it's an external module
    if (this.isExternalModule(specifier)) {
      result = {
        path: specifier,
        external: true,
        sideEffects: true,
      };
    }
    // 2. Check aliases
    else if (this.options.alias[specifier]) {
      const aliasPath = this.options.alias[specifier];
      result = this.resolveFile(aliasPath, path.dirname(importer));
    }
    // 3. Check TypeScript path mappings
    else if (this.tsPathMappings.size > 0) {
      const tsPath = this.resolveTypeScriptPath(specifier);
      if (tsPath) {
        result = this.resolveFile(tsPath, path.dirname(importer));
      }
    }
    // 4. Relative or absolute path
    else if (specifier.startsWith(".") || specifier.startsWith("/")) {
      const basePath = path.dirname(importer);
      const fullPath = path.resolve(basePath, specifier);
      result = this.resolveFile(fullPath, basePath);
    }
    // 5. Node modules
    else {
      result = this.resolveNodeModule(specifier, importer);
    }

    if (result) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Check if a specifier is an external module
   */
  private isExternalModule(specifier: string): boolean {
    // Built-in Node.js modules
    const builtins = [
      "assert", "buffer", "child_process", "cluster", "crypto", "dgram", "dns",
      "domain", "events", "fs", "http", "https", "net", "os", "path", "punycode",
      "querystring", "readline", "repl", "stream", "string_decoder", "timers",
      "tls", "tty", "url", "util", "v8", "vm", "zlib"
    ];

    // Check if it's a built-in module
    if (builtins.includes(specifier)) {
      return true;
    }

    // Check if it starts with node: protocol
    if (specifier.startsWith("node:")) {
      return true;
    }

    return false;
  }

  /**
   * Resolve a file path with extensions
   */
  private resolveFile(filePath: string, baseDir: string): ResolveResult | null {
    // Try exact path
    if (this.fileExists(filePath)) {
      return this.createResult(filePath);
    }

    // Try with extensions
    for (const ext of this.options.extensions) {
      const pathWithExt = filePath + ext;
      if (this.fileExists(pathWithExt)) {
        return this.createResult(pathWithExt);
      }
    }

    // Try as directory with main files
    if (this.isDirectory(filePath)) {
      for (const mainFile of this.options.mainFiles) {
        for (const ext of this.options.extensions) {
          const mainPath = path.join(filePath, mainFile + ext);
          if (this.fileExists(mainPath)) {
            return this.createResult(mainPath);
          }
        }
      }

      // Check package.json
      const pkgPath = path.join(filePath, "package.json");
      if (this.fileExists(pkgPath)) {
        const pkgResult = this.resolvePackageJson(pkgPath, baseDir);
        if (pkgResult) {
          return pkgResult;
        }
      }
    }

    return null;
  }

  /**
   * Resolve a node_modules package
   */
  private resolveNodeModule(specifier: string, importer: string): ResolveResult | null {
    let currentDir = path.dirname(importer);

    // Walk up the directory tree looking for node_modules
    while (true) {
      for (const modulesDir of this.options.modules) {
        const modulePath = path.join(currentDir, modulesDir, specifier);

        // Check if it's a directory
        if (this.isDirectory(modulePath)) {
          // Check package.json
          const pkgPath = path.join(modulePath, "package.json");
          if (this.fileExists(pkgPath)) {
            const pkgResult = this.resolvePackageJson(pkgPath, currentDir);
            if (pkgResult) {
              return pkgResult;
            }
          }

          // Try resolving as a file
          const fileResult = this.resolveFile(modulePath, currentDir);
          if (fileResult) {
            return fileResult;
          }
        }

        // Try resolving as a file directly
        const fileResult = this.resolveFile(modulePath, currentDir);
        if (fileResult) {
          return fileResult;
        }
      }

      // Move up one directory
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break; // Reached root
      }
      currentDir = parentDir;
    }

    return null;
  }

  /**
   * Resolve using package.json
   */
  private resolvePackageJson(pkgPath: string, baseDir: string): ResolveResult | null {
    try {
      const pkgContent = fs.readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgContent);
      const pkgDir = path.dirname(pkgPath);

      // Check exports field (modern Node.js resolution)
      if (pkg.exports) {
        const exportPath = this.resolveExports(pkg.exports, ".");
        if (exportPath) {
          const fullPath = path.join(pkgDir, exportPath);
          return this.createResult(fullPath, pkg.sideEffects !== false);
        }
      }

      // Check main fields
      for (const field of this.options.mainFields) {
        if (pkg[field]) {
          const mainPath = path.join(pkgDir, pkg[field]);
          const result = this.resolveFile(mainPath, baseDir);
          if (result) {
            result.sideEffects = pkg.sideEffects !== false;
            result.type = pkg.type === "module" ? "module" : "commonjs";
            return result;
          }
        }
      }

      // Fallback to index
      for (const mainFile of this.options.mainFiles) {
        for (const ext of this.options.extensions) {
          const mainPath = path.join(pkgDir, mainFile + ext);
          if (this.fileExists(mainPath)) {
            return this.createResult(mainPath, pkg.sideEffects !== false);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return null;
  }

  /**
   * Resolve exports field
   */
  private resolveExports(exports: any, subpath: string): string | null {
    if (typeof exports === "string") {
      return exports;
    }

    if (Array.isArray(exports)) {
      for (const exp of exports) {
        const resolved = this.resolveExports(exp, subpath);
        if (resolved) return resolved;
      }
      return null;
    }

    if (typeof exports === "object") {
      // Check condition names
      for (const condition of this.options.conditionNames) {
        if (exports[condition]) {
          const resolved = this.resolveExports(exports[condition], subpath);
          if (resolved) return resolved;
        }
      }

      // Check subpaths
      if (exports[subpath]) {
        return this.resolveExports(exports[subpath], subpath);
      }

      // Check default
      if (exports.default) {
        return this.resolveExports(exports.default, subpath);
      }
    }

    return null;
  }

  /**
   * Resolve TypeScript path mapping
   */
  private resolveTypeScriptPath(specifier: string): string | null {
    for (const [pattern, paths] of this.tsPathMappings) {
      const regex = new RegExp("^" + pattern.replace("*", "(.*)") + "$");
      const match = specifier.match(regex);

      if (match) {
        for (const mappedPath of paths) {
          const resolved = mappedPath.replace("*", match[1] || "");
          if (this.fileExists(resolved)) {
            return resolved;
          }
        }
      }
    }

    return null;
  }

  /**
   * Load TypeScript path mappings from tsconfig.json
   */
  private loadTsPathMappings(tsConfigPath: string): void {
    try {
      if (!this.fileExists(tsConfigPath)) {
        return;
      }

      const tsConfigContent = fs.readFileSync(tsConfigPath, "utf-8");
      const tsConfig = JSON.parse(tsConfigContent);

      if (tsConfig.compilerOptions?.paths) {
        const baseUrl = tsConfig.compilerOptions.baseUrl || ".";
        const basePath = path.dirname(tsConfigPath);

        for (const [pattern, paths] of Object.entries(tsConfig.compilerOptions.paths)) {
          const resolvedPaths = (paths as string[]).map((p) =>
            path.resolve(basePath, baseUrl, p)
          );
          this.tsPathMappings.set(pattern, resolvedPaths);
        }
      }
    } catch (error) {
      console.warn(`Failed to load tsconfig.json: ${error}`);
    }
  }

  /**
   * Create a resolve result
   */
  private createResult(filePath: string, sideEffects: boolean = true): ResolveResult {
    return {
      path: filePath,
      external: false,
      sideEffects,
    };
  }

  /**
   * Check if a file exists
   */
  private fileExists(filePath: string): boolean {
    try {
      const stat = fs.statSync(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Check if a path is a directory
   */
  private isDirectory(dirPath: string): boolean {
    try {
      const stat = fs.statSync(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
