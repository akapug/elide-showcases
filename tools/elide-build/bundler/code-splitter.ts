/**
 * Code Splitter
 *
 * Implements intelligent code splitting strategies:
 * - Dynamic import boundaries
 * - Common chunk extraction
 * - Vendor bundle separation
 * - Route-based splitting
 * - Size-based splitting
 */

import { ModuleInfo, ModuleGraph } from "./module-graph";

export interface CodeSplitOptions {
  strategy?: "dynamic" | "common" | "vendor" | "route" | "size" | "all";
  minChunkSize?: number;
  maxChunkSize?: number;
  minChunks?: number;
  maxInitialRequests?: number;
  maxAsyncRequests?: number;
  priority?: Record<string, number>;
  cacheGroups?: Record<string, CacheGroup>;
}

export interface CacheGroup {
  test?: RegExp | ((module: ModuleInfo) => boolean);
  priority?: number;
  minChunks?: number;
  maxChunks?: number;
  reuseExistingChunk?: boolean;
  enforce?: boolean;
}

export interface Chunk {
  id: string;
  name?: string;
  modules: Set<string>;
  size: number;
  isEntry: boolean;
  isAsync: boolean;
  parents: Set<string>;
  children: Set<string>;
  hash: string;
}

export interface SplitResult {
  chunks: Chunk[];
  chunkMap: Map<string, string>; // module id -> chunk id
  stats: SplitStats;
}

export interface SplitStats {
  totalChunks: number;
  entryChunks: number;
  asyncChunks: number;
  commonChunks: number;
  totalSize: number;
  averageChunkSize: number;
  largestChunk: number;
  smallestChunk: number;
}

export class CodeSplitter {
  private options: Required<CodeSplitOptions>;
  private chunks: Map<string, Chunk> = new Map();
  private chunkCounter: number = 0;

  constructor(options: CodeSplitOptions = {}) {
    this.options = {
      strategy: options.strategy || "all",
      minChunkSize: options.minChunkSize || 20 * 1024, // 20 KB
      maxChunkSize: options.maxChunkSize || 244 * 1024, // 244 KB
      minChunks: options.minChunks || 1,
      maxInitialRequests: options.maxInitialRequests || 30,
      maxAsyncRequests: options.maxAsyncRequests || 30,
      priority: options.priority || {},
      cacheGroups: options.cacheGroups || this.getDefaultCacheGroups(),
    };
  }

  /**
   * Split code into optimized chunks
   */
  split(graph: ModuleGraph): SplitResult {
    const modules = graph.getAllModules();
    const entryPoints = graph.getEntryPoints();

    // Clear previous chunks
    this.chunks.clear();
    this.chunkCounter = 0;

    // Create entry chunks
    for (const entry of entryPoints) {
      this.createChunk(entry, modules, graph, true, false);
    }

    // Apply splitting strategies
    if (this.options.strategy === "all" || this.options.strategy === "dynamic") {
      this.splitByDynamicImports(modules, graph);
    }

    if (this.options.strategy === "all" || this.options.strategy === "common") {
      this.splitCommonChunks(modules, graph);
    }

    if (this.options.strategy === "all" || this.options.strategy === "vendor") {
      this.splitVendorChunks(modules, graph);
    }

    if (this.options.strategy === "all" || this.options.strategy === "size") {
      this.splitBySize(modules, graph);
    }

    // Apply cache groups
    this.applyCacheGroups(modules, graph);

    // Build chunk map
    const chunkMap = new Map<string, string>();
    for (const chunk of this.chunks.values()) {
      for (const moduleId of chunk.modules) {
        chunkMap.set(moduleId, chunk.id);
      }
    }

    // Calculate statistics
    const stats = this.calculateStats();

    return {
      chunks: Array.from(this.chunks.values()),
      chunkMap,
      stats,
    };
  }

  /**
   * Create a new chunk
   */
  private createChunk(
    moduleId: string,
    modules: ModuleInfo[],
    graph: ModuleGraph,
    isEntry: boolean,
    isAsync: boolean
  ): Chunk {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    const chunkId = `chunk-${this.chunkCounter++}`;
    const chunk: Chunk = {
      id: chunkId,
      name: isEntry ? this.getChunkName(moduleId) : undefined,
      modules: new Set([moduleId]),
      size: module.size,
      isEntry,
      isAsync,
      parents: new Set(),
      children: new Set(),
      hash: this.generateHash(chunkId),
    };

    // Add dependencies to chunk
    const dependencies = graph.getTransitiveDependencies(moduleId);
    for (const dep of dependencies) {
      if (dep !== moduleId) {
        const depModule = modules.find((m) => m.id === dep);
        if (depModule && !depModule.isExternal) {
          chunk.modules.add(dep);
          chunk.size += depModule.size;
        }
      }
    }

    this.chunks.set(chunkId, chunk);
    return chunk;
  }

  /**
   * Split by dynamic imports
   */
  private splitByDynamicImports(modules: ModuleInfo[], graph: ModuleGraph): void {
    for (const module of modules) {
      for (const dynamicDep of module.dynamicDependencies) {
        // Check if this dynamic dependency already has a chunk
        let hasChunk = false;
        for (const chunk of this.chunks.values()) {
          if (chunk.modules.has(dynamicDep) && chunk.isAsync) {
            hasChunk = true;
            break;
          }
        }

        if (!hasChunk) {
          const chunk = this.createChunk(dynamicDep, modules, graph, false, true);

          // Link parent and child chunks
          for (const parentChunk of this.chunks.values()) {
            if (parentChunk.modules.has(module.id)) {
              chunk.parents.add(parentChunk.id);
              parentChunk.children.add(chunk.id);
            }
          }
        }
      }
    }
  }

  /**
   * Split common chunks (shared dependencies)
   */
  private splitCommonChunks(modules: ModuleInfo[], graph: ModuleGraph): void {
    const moduleUsage = new Map<string, Set<string>>();

    // Count how many chunks use each module
    for (const chunk of this.chunks.values()) {
      for (const moduleId of chunk.modules) {
        if (!moduleUsage.has(moduleId)) {
          moduleUsage.set(moduleId, new Set());
        }
        moduleUsage.get(moduleId)!.add(chunk.id);
      }
    }

    // Find modules used by multiple chunks
    const commonModules = new Set<string>();
    for (const [moduleId, chunks] of moduleUsage) {
      if (chunks.size >= this.options.minChunks) {
        commonModules.add(moduleId);
      }
    }

    if (commonModules.size > 0) {
      // Create common chunk
      const commonChunkId = `chunk-common-${this.chunkCounter++}`;
      let totalSize = 0;

      for (const moduleId of commonModules) {
        const module = modules.find((m) => m.id === moduleId);
        if (module) {
          totalSize += module.size;
        }
      }

      const commonChunk: Chunk = {
        id: commonChunkId,
        name: "common",
        modules: commonModules,
        size: totalSize,
        isEntry: false,
        isAsync: false,
        parents: new Set(),
        children: new Set(),
        hash: this.generateHash(commonChunkId),
      };

      this.chunks.set(commonChunkId, commonChunk);

      // Remove common modules from other chunks
      for (const chunk of this.chunks.values()) {
        if (chunk.id !== commonChunkId) {
          for (const moduleId of commonModules) {
            if (chunk.modules.has(moduleId)) {
              chunk.modules.delete(moduleId);

              const module = modules.find((m) => m.id === moduleId);
              if (module) {
                chunk.size -= module.size;
              }

              // Link chunks
              chunk.children.add(commonChunkId);
              commonChunk.parents.add(chunk.id);
            }
          }
        }
      }
    }
  }

  /**
   * Split vendor chunks (node_modules)
   */
  private splitVendorChunks(modules: ModuleInfo[], graph: ModuleGraph): void {
    const vendorModules = new Set<string>();

    for (const module of modules) {
      if (module.path.includes("node_modules")) {
        vendorModules.add(module.id);
      }
    }

    if (vendorModules.size > 0) {
      const vendorChunkId = `chunk-vendor-${this.chunkCounter++}`;
      let totalSize = 0;

      for (const moduleId of vendorModules) {
        const module = modules.find((m) => m.id === moduleId);
        if (module) {
          totalSize += module.size;
        }
      }

      const vendorChunk: Chunk = {
        id: vendorChunkId,
        name: "vendor",
        modules: vendorModules,
        size: totalSize,
        isEntry: false,
        isAsync: false,
        parents: new Set(),
        children: new Set(),
        hash: this.generateHash(vendorChunkId),
      };

      this.chunks.set(vendorChunkId, vendorChunk);

      // Remove vendor modules from other chunks
      for (const chunk of this.chunks.values()) {
        if (chunk.id !== vendorChunkId) {
          for (const moduleId of vendorModules) {
            if (chunk.modules.has(moduleId)) {
              chunk.modules.delete(moduleId);

              const module = modules.find((m) => m.id === moduleId);
              if (module) {
                chunk.size -= module.size;
              }

              chunk.children.add(vendorChunkId);
              vendorChunk.parents.add(chunk.id);
            }
          }
        }
      }
    }
  }

  /**
   * Split by size constraints
   */
  private splitBySize(modules: ModuleInfo[], graph: ModuleGraph): void {
    const chunksToSplit: Chunk[] = [];

    for (const chunk of this.chunks.values()) {
      if (chunk.size > this.options.maxChunkSize) {
        chunksToSplit.push(chunk);
      }
    }

    for (const chunk of chunksToSplit) {
      const moduleArray = Array.from(chunk.modules);
      const subChunks: Set<string>[] = [];
      let currentSubChunk = new Set<string>();
      let currentSize = 0;

      for (const moduleId of moduleArray) {
        const module = modules.find((m) => m.id === moduleId);
        if (!module) continue;

        if (currentSize + module.size > this.options.maxChunkSize && currentSubChunk.size > 0) {
          subChunks.push(currentSubChunk);
          currentSubChunk = new Set();
          currentSize = 0;
        }

        currentSubChunk.add(moduleId);
        currentSize += module.size;
      }

      if (currentSubChunk.size > 0) {
        subChunks.push(currentSubChunk);
      }

      // Create new chunks for each sub-chunk
      if (subChunks.length > 1) {
        this.chunks.delete(chunk.id);

        for (let i = 0; i < subChunks.length; i++) {
          const subChunkId = `${chunk.id}-${i}`;
          let subChunkSize = 0;

          for (const moduleId of subChunks[i]) {
            const module = modules.find((m) => m.id === moduleId);
            if (module) {
              subChunkSize += module.size;
            }
          }

          const newChunk: Chunk = {
            id: subChunkId,
            name: chunk.name ? `${chunk.name}-${i}` : undefined,
            modules: subChunks[i],
            size: subChunkSize,
            isEntry: chunk.isEntry && i === 0,
            isAsync: chunk.isAsync,
            parents: new Set(chunk.parents),
            children: new Set(chunk.children),
            hash: this.generateHash(subChunkId),
          };

          this.chunks.set(subChunkId, newChunk);
        }
      }
    }
  }

  /**
   * Apply cache groups for custom splitting
   */
  private applyCacheGroups(modules: ModuleInfo[], graph: ModuleGraph): void {
    for (const [groupName, cacheGroup] of Object.entries(this.options.cacheGroups)) {
      const matchingModules = new Set<string>();

      for (const module of modules) {
        let matches = false;

        if (cacheGroup.test instanceof RegExp) {
          matches = cacheGroup.test.test(module.path);
        } else if (typeof cacheGroup.test === "function") {
          matches = cacheGroup.test(module);
        }

        if (matches) {
          matchingModules.add(module.id);
        }
      }

      if (matchingModules.size > 0) {
        const groupChunkId = `chunk-${groupName}-${this.chunkCounter++}`;
        let totalSize = 0;

        for (const moduleId of matchingModules) {
          const module = modules.find((m) => m.id === moduleId);
          if (module) {
            totalSize += module.size;
          }
        }

        const groupChunk: Chunk = {
          id: groupChunkId,
          name: groupName,
          modules: matchingModules,
          size: totalSize,
          isEntry: false,
          isAsync: false,
          parents: new Set(),
          children: new Set(),
          hash: this.generateHash(groupChunkId),
        };

        this.chunks.set(groupChunkId, groupChunk);

        // Remove modules from other chunks if reuseExistingChunk is false
        if (!cacheGroup.reuseExistingChunk) {
          for (const chunk of this.chunks.values()) {
            if (chunk.id !== groupChunkId) {
              for (const moduleId of matchingModules) {
                if (chunk.modules.has(moduleId)) {
                  chunk.modules.delete(moduleId);

                  const module = modules.find((m) => m.id === moduleId);
                  if (module) {
                    chunk.size -= module.size;
                  }

                  chunk.children.add(groupChunkId);
                  groupChunk.parents.add(chunk.id);
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Get default cache groups
   */
  private getDefaultCacheGroups(): Record<string, CacheGroup> {
    return {
      vendors: {
        test: /node_modules/,
        priority: -10,
        reuseExistingChunk: true,
      },
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      },
    };
  }

  /**
   * Get chunk name from module path
   */
  private getChunkName(moduleId: string): string {
    const parts = moduleId.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/\.[^.]+$/, "");
  }

  /**
   * Generate hash for chunk
   */
  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Calculate splitting statistics
   */
  private calculateStats(): SplitStats {
    const chunks = Array.from(this.chunks.values());
    const totalChunks = chunks.length;
    const entryChunks = chunks.filter((c) => c.isEntry).length;
    const asyncChunks = chunks.filter((c) => c.isAsync).length;
    const commonChunks = chunks.filter((c) => c.name === "common" || c.name === "vendor").length;

    const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
    const averageChunkSize = totalChunks > 0 ? totalSize / totalChunks : 0;

    const sizes = chunks.map((c) => c.size);
    const largestChunk = sizes.length > 0 ? Math.max(...sizes) : 0;
    const smallestChunk = sizes.length > 0 ? Math.min(...sizes) : 0;

    return {
      totalChunks,
      entryChunks,
      asyncChunks,
      commonChunks,
      totalSize,
      averageChunkSize,
      largestChunk,
      smallestChunk,
    };
  }

  /**
   * Get statistics summary
   */
  getStatsSummary(stats: SplitStats): string {
    return `
Code Splitting Results:
  Total Chunks: ${stats.totalChunks}
  Entry Chunks: ${stats.entryChunks}
  Async Chunks: ${stats.asyncChunks}
  Common Chunks: ${stats.commonChunks}
  Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB
  Average Chunk Size: ${(stats.averageChunkSize / 1024).toFixed(2)} KB
  Largest Chunk: ${(stats.largestChunk / 1024).toFixed(2)} KB
  Smallest Chunk: ${(stats.smallestChunk / 1024).toFixed(2)} KB
    `.trim();
  }

  /**
   * Clear internal state
   */
  clear(): void {
    this.chunks.clear();
    this.chunkCounter = 0;
  }
}
