/**
 * Reload Manager
 *
 * Manages hot module replacement with intelligent dependency tracking.
 * Supports selective reloading and state preservation across reloads.
 */

interface Module {
  id: string;
  path: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  exports: any;
  lastReload: number;
  reloadCount: number;
  state?: any;
}

interface ReloadOptions {
  preserveState?: boolean;
  force?: boolean;
  cascade?: boolean;
}

export class ReloadManager {
  private root: string;
  private modules: Map<string, Module> = new Map();
  private moduleGraph: Map<string, Set<string>> = new Map();
  private reloadStats = {
    totalReloads: 0,
    successfulReloads: 0,
    failedReloads: 0,
    averageReloadTime: 0,
    fastestReload: Infinity,
    slowestReload: 0,
  };

  constructor(root: string) {
    this.root = root;
  }

  /**
   * Get all modules affected by a file change
   */
  async getAffectedModules(filePath: string): Promise<string[]> {
    const affected = new Set<string>();

    // Add the changed file itself
    affected.add(filePath);

    // Find all modules that depend on this file
    this.findDependents(filePath, affected);

    return Array.from(affected);
  }

  /**
   * Recursively find all dependent modules
   */
  private findDependents(modulePath: string, affected: Set<string>): void {
    const module = this.modules.get(modulePath);
    if (!module) return;

    for (const dependent of module.dependents) {
      if (!affected.has(dependent)) {
        affected.add(dependent);
        this.findDependents(dependent, affected);
      }
    }
  }

  /**
   * Reload multiple modules
   */
  async reloadModules(
    modulePaths: string[],
    options: ReloadOptions = {}
  ): Promise<string[]> {
    const startTime = performance.now();
    const reloaded: string[] = [];

    const {
      preserveState = true,
      force = false,
      cascade = true,
    } = options;

    console.log(`🔄 Reloading ${modulePaths.length} module(s)...`);

    // Sort modules by dependency order
    const sorted = this.topologicalSort(modulePaths);

    for (const modulePath of sorted) {
      try {
        const success = await this.reloadModule(modulePath, preserveState, force);
        if (success) {
          reloaded.push(modulePath);
          console.log(`✅ Reloaded: ${this.getRelativePath(modulePath)}`);
        }
      } catch (error) {
        console.error(`❌ Failed to reload ${modulePath}:`, error);
        this.reloadStats.failedReloads++;
      }
    }

    const reloadTime = performance.now() - startTime;
    this.updateReloadStats(reloadTime);

    console.log(`✨ Reloaded ${reloaded.length} modules in ${reloadTime.toFixed(2)}ms`);

    return reloaded;
  }

  /**
   * Reload a single module
   */
  private async reloadModule(
    modulePath: string,
    preserveState: boolean,
    force: boolean
  ): Promise<boolean> {
    const module = this.modules.get(modulePath);

    // Save state if needed
    let savedState: any = null;
    if (preserveState && module?.state) {
      savedState = { ...module.state };
    }

    // Clear module from cache
    this.clearModuleCache(modulePath);

    // Create or update module entry
    const newModule: Module = {
      id: modulePath,
      path: modulePath,
      dependencies: new Set(),
      dependents: new Set(),
      exports: {},
      lastReload: Date.now(),
      reloadCount: (module?.reloadCount || 0) + 1,
      state: savedState,
    };

    // Analyze dependencies
    await this.analyzeDependencies(newModule);

    this.modules.set(modulePath, newModule);
    this.reloadStats.successfulReloads++;

    return true;
  }

  /**
   * Analyze module dependencies
   */
  private async analyzeDependencies(module: Module): Promise<void> {
    // Simplified dependency analysis
    // In production, would parse the actual file and extract imports

    const fileExt = this.getFileExtension(module.path);

    // Simulate finding dependencies based on file type
    const possibleDeps = this.getPossibleDependencies(module.path, fileExt);

    for (const dep of possibleDeps) {
      module.dependencies.add(dep);

      // Update reverse dependency graph
      const depModule = this.modules.get(dep);
      if (depModule) {
        depModule.dependents.add(module.path);
      }
    }
  }

  /**
   * Get possible dependencies for a module (simplified)
   */
  private getPossibleDependencies(modulePath: string, extension: string): string[] {
    const deps: string[] = [];

    // Simulate dependency detection based on file type
    switch (extension) {
      case ".ts":
      case ".js":
        // TypeScript/JavaScript might import other TS/JS files
        deps.push(`${this.root}/src/utils.ts`);
        break;
      case ".py":
        // Python might import other Python files
        deps.push(`${this.root}/src/utils.py`);
        break;
      case ".rb":
        // Ruby might require other Ruby files
        deps.push(`${this.root}/lib/helper.rb`);
        break;
      case ".java":
        // Java might import other Java classes
        deps.push(`${this.root}/src/Helper.java`);
        break;
    }

    return deps;
  }

  /**
   * Clear module from cache
   */
  private clearModuleCache(modulePath: string): void {
    // In Node.js, would do: delete require.cache[require.resolve(modulePath)]
    // For Elide, might need to use Elide's module system
    console.log(`🗑️  Clearing cache: ${this.getRelativePath(modulePath)}`);
  }

  /**
   * Topological sort of modules for ordered reloading
   */
  private topologicalSort(modulePaths: string[]): string[] {
    const visited = new Set<string>();
    const sorted: string[] = [];

    const visit = (path: string) => {
      if (visited.has(path)) return;
      visited.add(path);

      const module = this.modules.get(path);
      if (module) {
        // Visit dependencies first
        for (const dep of module.dependencies) {
          if (modulePaths.includes(dep)) {
            visit(dep);
          }
        }
      }

      sorted.push(path);
    };

    for (const path of modulePaths) {
      visit(path);
    }

    return sorted;
  }

  /**
   * Update reload statistics
   */
  private updateReloadStats(reloadTime: number): void {
    this.reloadStats.totalReloads++;

    // Update average
    const total = this.reloadStats.averageReloadTime * (this.reloadStats.totalReloads - 1);
    this.reloadStats.averageReloadTime = (total + reloadTime) / this.reloadStats.totalReloads;

    // Update fastest/slowest
    this.reloadStats.fastestReload = Math.min(this.reloadStats.fastestReload, reloadTime);
    this.reloadStats.slowestReload = Math.max(this.reloadStats.slowestReload, reloadTime);
  }

  /**
   * Get reload statistics
   */
  getStats() {
    return {
      ...this.reloadStats,
      modules: this.modules.size,
      averageReloadTime: this.reloadStats.averageReloadTime.toFixed(2),
      fastestReload: this.reloadStats.fastestReload === Infinity ? 0 : this.reloadStats.fastestReload.toFixed(2),
      slowestReload: this.reloadStats.slowestReload.toFixed(2),
    };
  }

  /**
   * Get module graph for visualization
   */
  getModuleGraph(): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    for (const [path, module] of this.modules) {
      nodes.push({
        id: path,
        label: this.getRelativePath(path),
        reloadCount: module.reloadCount,
        dependencies: module.dependencies.size,
        dependents: module.dependents.size,
      });

      for (const dep of module.dependencies) {
        edges.push({
          from: path,
          to: dep,
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Preserve module state
   */
  preserveState(modulePath: string, state: any): void {
    const module = this.modules.get(modulePath);
    if (module) {
      module.state = state;
      console.log(`💾 State preserved for ${this.getRelativePath(modulePath)}`);
    }
  }

  /**
   * Restore module state
   */
  restoreState(modulePath: string): any {
    const module = this.modules.get(modulePath);
    if (module?.state) {
      console.log(`♻️  State restored for ${this.getRelativePath(modulePath)}`);
      return module.state;
    }
    return null;
  }

  /**
   * Get file extension
   */
  private getFileExtension(filePath: string): string {
    const match = filePath.match(/\.[^.]+$/);
    return match ? match[0] : "";
  }

  /**
   * Get relative path from root
   */
  private getRelativePath(filePath: string): string {
    return filePath.replace(this.root + "/", "");
  }

  /**
   * Register a module manually
   */
  registerModule(modulePath: string): void {
    if (!this.modules.has(modulePath)) {
      this.modules.set(modulePath, {
        id: modulePath,
        path: modulePath,
        dependencies: new Set(),
        dependents: new Set(),
        exports: {},
        lastReload: Date.now(),
        reloadCount: 0,
      });
      console.log(`📝 Registered module: ${this.getRelativePath(modulePath)}`);
    }
  }

  /**
   * Unregister a module
   */
  unregisterModule(modulePath: string): void {
    const module = this.modules.get(modulePath);
    if (module) {
      // Remove from dependents
      for (const dep of module.dependencies) {
        const depModule = this.modules.get(dep);
        if (depModule) {
          depModule.dependents.delete(modulePath);
        }
      }

      this.modules.delete(modulePath);
      console.log(`🗑️  Unregistered module: ${this.getRelativePath(modulePath)}`);
    }
  }

  /**
   * Clear all modules
   */
  clear(): void {
    this.modules.clear();
    this.moduleGraph.clear();
    console.log("🗑️  All modules cleared");
  }
}

// CLI demo
if (import.meta.url.includes("reload-manager.ts")) {
  console.log("🔄 Reload Manager Demo\n");

  const manager = new ReloadManager(process.cwd());

  // Register some test modules
  const modules = [
    `${process.cwd()}/src/index.ts`,
    `${process.cwd()}/src/server.ts`,
    `${process.cwd()}/src/utils.ts`,
    `${process.cwd()}/src/main.py`,
  ];

  console.log("📝 Registering modules...\n");
  for (const mod of modules) {
    manager.registerModule(mod);
  }

  // Simulate file changes and reloads
  (async () => {
    console.log("\n🔄 Simulating file changes...\n");

    // First reload
    const affected1 = await manager.getAffectedModules(`${process.cwd()}/src/utils.ts`);
    console.log(`📦 Affected modules: ${affected1.length}`);
    await manager.reloadModules(affected1);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Second reload
    const affected2 = await manager.getAffectedModules(`${process.cwd()}/src/server.ts`);
    await manager.reloadModules(affected2);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Third reload (fast one)
    const affected3 = await manager.getAffectedModules(`${process.cwd()}/src/main.py`);
    await manager.reloadModules(affected3);

    // Show stats
    console.log("\n📊 Reload Statistics:");
    const stats = manager.getStats();
    console.log(JSON.stringify(stats, null, 2));

    // Show module graph
    console.log("\n🕸️  Module Graph:");
    const graph = manager.getModuleGraph();
    console.log(`Nodes: ${graph.nodes.length}`);
    console.log(`Edges: ${graph.edges.length}`);

    console.log("\n✅ Demo completed!");
  })();
}
