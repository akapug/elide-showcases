/**
 * Module Graph Builder
 *
 * Builds and maintains a dependency graph of all modules in the project.
 * Supports:
 * - Circular dependency detection
 * - Dynamic imports
 * - CommonJS and ES modules
 * - Multi-language support (TypeScript, JavaScript, Python, Ruby)
 */

export interface ModuleInfo {
  id: string;
  path: string;
  type: "js" | "ts" | "jsx" | "tsx" | "py" | "rb" | "css" | "json" | "asset";
  dependencies: Set<string>;
  dynamicDependencies: Set<string>;
  exports: Set<string>;
  imports: Map<string, Set<string>>;
  size: number;
  hash: string;
  isEntry: boolean;
  isExternal: boolean;
  sideEffects: boolean;
  circular: boolean;
  depth: number;
}

export interface GraphStats {
  modules: number;
  edges: number;
  circularDependencies: number;
  depth: number;
  totalSize: number;
  cacheHitRate: number;
}

export class ModuleGraph {
  private modules: Map<string, ModuleInfo> = new Map();
  private reverseDependencies: Map<string, Set<string>> = new Map();
  private entryPoints: Set<string> = new Set();
  private externalModules: Set<string> = new Set();
  private circularDependencies: Set<string> = new Set();
  private cache: Map<string, ModuleInfo> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor() {}

  /**
   * Add a module to the graph
   */
  addModule(moduleInfo: ModuleInfo): void {
    const { id, dependencies, dynamicDependencies, isEntry, isExternal } = moduleInfo;

    // Check cache first
    const cached = this.cache.get(moduleInfo.hash);
    if (cached && cached.hash === moduleInfo.hash) {
      this.modules.set(id, cached);
      this.cacheHits++;
      return;
    }

    this.cacheMisses++;
    this.modules.set(id, moduleInfo);
    this.cache.set(moduleInfo.hash, moduleInfo);

    if (isEntry) {
      this.entryPoints.add(id);
    }

    if (isExternal) {
      this.externalModules.add(id);
    }

    // Build reverse dependency map
    for (const dep of dependencies) {
      if (!this.reverseDependencies.has(dep)) {
        this.reverseDependencies.set(dep, new Set());
      }
      this.reverseDependencies.get(dep)!.add(id);
    }

    for (const dep of dynamicDependencies) {
      if (!this.reverseDependencies.has(dep)) {
        this.reverseDependencies.set(dep, new Set());
      }
      this.reverseDependencies.get(dep)!.add(id);
    }

    // Detect circular dependencies
    if (this.hasCircularDependency(id)) {
      moduleInfo.circular = true;
      this.circularDependencies.add(id);
    }
  }

  /**
   * Get a module by ID
   */
  getModule(id: string): ModuleInfo | undefined {
    return this.modules.get(id);
  }

  /**
   * Get all modules
   */
  getAllModules(): ModuleInfo[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get entry points
   */
  getEntryPoints(): string[] {
    return Array.from(this.entryPoints);
  }

  /**
   * Get modules that depend on a given module
   */
  getDependents(id: string): Set<string> {
    return this.reverseDependencies.get(id) || new Set();
  }

  /**
   * Get all dependencies of a module (transitive)
   */
  getTransitiveDependencies(id: string, visited = new Set<string>()): Set<string> {
    const module = this.modules.get(id);
    if (!module || visited.has(id)) {
      return visited;
    }

    visited.add(id);

    for (const dep of module.dependencies) {
      this.getTransitiveDependencies(dep, visited);
    }

    return visited;
  }

  /**
   * Get all dependents of a module (transitive)
   */
  getTransitiveDependents(id: string, visited = new Set<string>()): Set<string> {
    if (visited.has(id)) {
      return visited;
    }

    visited.add(id);

    const dependents = this.getDependents(id);
    for (const dependent of dependents) {
      this.getTransitiveDependents(dependent, visited);
    }

    return visited;
  }

  /**
   * Check if a module has circular dependencies
   */
  hasCircularDependency(id: string, visited = new Set<string>(), path = new Set<string>()): boolean {
    if (path.has(id)) {
      return true; // Circular dependency found
    }

    if (visited.has(id)) {
      return false; // Already checked this path
    }

    visited.add(id);
    path.add(id);

    const module = this.modules.get(id);
    if (!module) {
      path.delete(id);
      return false;
    }

    for (const dep of module.dependencies) {
      if (this.hasCircularDependency(dep, visited, path)) {
        path.delete(id);
        return true;
      }
    }

    path.delete(id);
    return false;
  }

  /**
   * Get circular dependencies in the graph
   */
  getCircularDependencies(): Set<string> {
    return new Set(this.circularDependencies);
  }

  /**
   * Calculate the depth of each module (distance from entry points)
   */
  calculateDepths(): void {
    const depths = new Map<string, number>();

    // BFS from entry points
    const queue: Array<{ id: string; depth: number }> = [];
    for (const entry of this.entryPoints) {
      queue.push({ id: entry, depth: 0 });
      depths.set(entry, 0);
    }

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const module = this.modules.get(id);

      if (!module) continue;

      module.depth = depth;

      for (const dep of module.dependencies) {
        const currentDepth = depths.get(dep);
        if (currentDepth === undefined || currentDepth > depth + 1) {
          depths.set(dep, depth + 1);
          queue.push({ id: dep, depth: depth + 1 });
        }
      }
    }

    // Update module depths
    for (const [id, depth] of depths) {
      const module = this.modules.get(id);
      if (module) {
        module.depth = depth;
      }
    }
  }

  /**
   * Get modules sorted by depth (for optimal bundling order)
   */
  getModulesByDepth(): ModuleInfo[] {
    this.calculateDepths();
    return Array.from(this.modules.values()).sort((a, b) => a.depth - b.depth);
  }

  /**
   * Get modules that can be code-split (async boundaries)
   */
  getCodeSplitCandidates(): ModuleInfo[] {
    const candidates: ModuleInfo[] = [];

    for (const module of this.modules.values()) {
      // Skip entry points and external modules
      if (module.isEntry || module.isExternal) continue;

      // Check if module is imported dynamically
      let dynamicImport = false;
      for (const dependent of this.getDependents(module.id)) {
        const depModule = this.modules.get(dependent);
        if (depModule?.dynamicDependencies.has(module.id)) {
          dynamicImport = true;
          break;
        }
      }

      if (dynamicImport) {
        candidates.push(module);
      }
    }

    return candidates;
  }

  /**
   * Find common dependencies between modules (for chunk deduplication)
   */
  findCommonDependencies(moduleIds: string[]): Set<string> {
    if (moduleIds.length === 0) return new Set();

    const commonDeps = this.getTransitiveDependencies(moduleIds[0]);

    for (let i = 1; i < moduleIds.length; i++) {
      const deps = this.getTransitiveDependencies(moduleIds[i]);
      for (const dep of commonDeps) {
        if (!deps.has(dep)) {
          commonDeps.delete(dep);
        }
      }
    }

    return commonDeps;
  }

  /**
   * Get statistics about the graph
   */
  getStats(): GraphStats {
    const modules = this.modules.size;
    let edges = 0;
    let maxDepth = 0;
    let totalSize = 0;

    for (const module of this.modules.values()) {
      edges += module.dependencies.size + module.dynamicDependencies.size;
      maxDepth = Math.max(maxDepth, module.depth);
      totalSize += module.size;
    }

    const totalRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;

    return {
      modules,
      edges,
      circularDependencies: this.circularDependencies.size,
      depth: maxDepth,
      totalSize,
      cacheHitRate,
    };
  }

  /**
   * Export graph as DOT format (for visualization)
   */
  toDot(): string {
    let dot = "digraph ModuleGraph {\n";
    dot += '  node [shape=box, style=rounded];\n';

    // Add nodes
    for (const module of this.modules.values()) {
      const color = module.isEntry ? "lightblue" : module.isExternal ? "lightgray" : "white";
      const shape = module.circular ? "doubleoctagon" : "box";
      dot += `  "${module.id}" [fillcolor="${color}", style=filled, shape=${shape}];\n`;
    }

    // Add edges
    for (const module of this.modules.values()) {
      for (const dep of module.dependencies) {
        dot += `  "${module.id}" -> "${dep}";\n`;
      }
      for (const dep of module.dynamicDependencies) {
        dot += `  "${module.id}" -> "${dep}" [style=dashed];\n`;
      }
    }

    dot += "}\n";
    return dot;
  }

  /**
   * Export graph as JSON
   */
  toJSON(): any {
    const modules = Array.from(this.modules.entries()).map(([id, info]) => ({
      id,
      path: info.path,
      type: info.type,
      dependencies: Array.from(info.dependencies),
      dynamicDependencies: Array.from(info.dynamicDependencies),
      exports: Array.from(info.exports),
      size: info.size,
      hash: info.hash,
      isEntry: info.isEntry,
      isExternal: info.isExternal,
      sideEffects: info.sideEffects,
      circular: info.circular,
      depth: info.depth,
    }));

    return {
      modules,
      entryPoints: Array.from(this.entryPoints),
      externalModules: Array.from(this.externalModules),
      circularDependencies: Array.from(this.circularDependencies),
      stats: this.getStats(),
    };
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.modules.clear();
    this.reverseDependencies.clear();
    this.entryPoints.clear();
    this.externalModules.clear();
    this.circularDependencies.clear();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
