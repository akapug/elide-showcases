/**
 * Vite Clone - Module Graph
 *
 * Tracks relationships between modules including:
 * - Import/export relationships
 * - HMR accept boundaries
 * - Transformation cache
 * - Dependency tracking
 */

import { cleanUrl, normalizePath } from '../core/config';

/**
 * Module node in the module graph
 */
export class ModuleNode {
  /**
   * Public fields
   */
  url: string;
  id: string | null = null;
  file: string | null = null;
  type: 'js' | 'css' | 'asset' | 'custom' = 'js';

  /**
   * Import relationships
   */
  importers = new Set<ModuleNode>();
  importedModules = new Set<ModuleNode>();
  acceptedHmrDeps = new Set<ModuleNode>();
  isSelfAccepting = false;

  /**
   * Transform cache
   */
  transformResult: TransformResult | null = null;
  ssrTransformResult: TransformResult | null = null;
  ssrModule: any | null = null;

  /**
   * Last HMR timestamp
   */
  lastHMRTimestamp = 0;

  /**
   * Invalidation timestamp
   */
  lastInvalidationTimestamp = 0;

  /**
   * During hot update, track which modules need to be updated
   */
  importedBindings: Map<string, Set<string>> | null = null;

  constructor(url: string) {
    this.url = url;
  }
}

/**
 * Transform result interface
 */
export interface TransformResult {
  code: string;
  map: any | null;
  etag?: string;
  deps?: string[];
  dynamicDeps?: string[];
}

/**
 * Module graph manages all module nodes and their relationships
 */
export class ModuleGraph {
  /**
   * URL to module node map
   */
  urlToModuleMap = new Map<string, ModuleNode>();

  /**
   * File to module nodes map (one file can have multiple modules with different query strings)
   */
  fileToModulesMap = new Map<string, Set<ModuleNode>>();

  /**
   * ID to module node map
   */
  idToModuleMap = new Map<string, ModuleNode>();

  /**
   * Get module by URL
   */
  getModuleByUrl(url: string): ModuleNode | undefined {
    return this.urlToModuleMap.get(cleanUrl(url));
  }

  /**
   * Get module by ID
   */
  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(cleanUrl(id));
  }

  /**
   * Get modules by file path
   */
  getModulesByFile(file: string): Set<ModuleNode> | undefined {
    return this.fileToModulesMap.get(normalizePath(file));
  }

  /**
   * Ensure a module exists in the graph
   */
  async ensureEntryFromUrl(url: string): Promise<ModuleNode> {
    const cleanedUrl = cleanUrl(url);
    let mod = this.urlToModuleMap.get(cleanedUrl);

    if (!mod) {
      mod = new ModuleNode(cleanedUrl);
      this.urlToModuleMap.set(cleanedUrl, mod);
    }

    return mod;
  }

  /**
   * Create a module node
   */
  createModuleNode(url: string, file?: string | null, setIsSelfAccepting = false): ModuleNode {
    const mod = new ModuleNode(url);
    mod.file = file || null;
    mod.isSelfAccepting = setIsSelfAccepting;

    this.urlToModuleMap.set(url, mod);

    if (file) {
      const normalizedFile = normalizePath(file);
      let modules = this.fileToModulesMap.get(normalizedFile);
      if (!modules) {
        modules = new Set();
        this.fileToModulesMap.set(normalizedFile, modules);
      }
      modules.add(mod);
    }

    return mod;
  }

  /**
   * Update module info
   */
  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>,
    importedBindings: Map<string, Set<string>> | null,
    acceptedModules: Set<string | ModuleNode>,
    isSelfAccepting: boolean,
  ): Promise<Set<ModuleNode>> {
    mod.isSelfAccepting = isSelfAccepting;
    mod.importedBindings = importedBindings;

    const prevImports = mod.importedModules;
    const nextImports = new Set<ModuleNode>();

    // Resolve imported modules
    for (const imported of importedModules) {
      const dep =
        typeof imported === 'string'
          ? await this.ensureEntryFromUrl(imported)
          : imported;

      nextImports.add(dep);
      dep.importers.add(mod);
    }

    // Remove old imports
    for (const prevImport of prevImports) {
      if (!nextImports.has(prevImport)) {
        prevImport.importers.delete(mod);
      }
    }

    mod.importedModules = nextImports;

    // Update accepted modules
    const prevAccepted = mod.acceptedHmrDeps;
    const nextAccepted = new Set<ModuleNode>();

    for (const accepted of acceptedModules) {
      const dep =
        typeof accepted === 'string'
          ? await this.ensureEntryFromUrl(accepted)
          : accepted;
      nextAccepted.add(dep);
    }

    mod.acceptedHmrDeps = nextAccepted;

    // Return modules that were removed from imports
    const removed = new Set<ModuleNode>();
    for (const prevImport of prevImports) {
      if (!nextImports.has(prevImport)) {
        removed.add(prevImport);
      }
    }

    return removed;
  }

  /**
   * Invalidate module
   */
  invalidateModule(mod: ModuleNode, seen = new Set<ModuleNode>()): void {
    if (seen.has(mod)) {
      return;
    }

    seen.add(mod);

    mod.transformResult = null;
    mod.ssrTransformResult = null;
    mod.ssrModule = null;
    mod.lastInvalidationTimestamp = Date.now();

    // Invalidate importers
    for (const importer of mod.importers) {
      if (!importer.acceptedHmrDeps.has(mod)) {
        this.invalidateModule(importer, seen);
      }
    }
  }

  /**
   * Invalidate all modules
   */
  invalidateAll(): void {
    for (const mod of this.urlToModuleMap.values()) {
      mod.transformResult = null;
      mod.ssrTransformResult = null;
      mod.ssrModule = null;
    }
  }

  /**
   * On file change, invalidate affected modules
   */
  onFileChange(file: string): Set<ModuleNode> {
    const normalizedFile = normalizePath(file);
    const mods = this.fileToModulesMap.get(normalizedFile);

    if (mods) {
      for (const mod of mods) {
        this.invalidateModule(mod);
      }
      return mods;
    }

    return new Set();
  }

  /**
   * Resolve URL to file path
   */
  async resolveUrl(url: string): Promise<string | null> {
    // This would use the resolver to convert URL to file path
    // Simplified implementation
    return url;
  }

  /**
   * Get all modules
   */
  getModules(): IterableIterator<ModuleNode> {
    return this.urlToModuleMap.values();
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.urlToModuleMap.clear();
    this.fileToModulesMap.clear();
    this.idToModuleMap.clear();
  }
}

/**
 * Create a new module graph instance
 */
export function createModuleGraph(): ModuleGraph {
  return new ModuleGraph();
}
