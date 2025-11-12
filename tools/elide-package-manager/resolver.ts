/**
 * Dependency Resolver
 *
 * Handles polyglot dependency resolution with conflict detection,
 * circular dependency detection, and dependency graph visualization.
 */

export interface Package {
  name: string;
  version: string;
  ecosystem: "npm" | "pypi" | "maven" | "rubygems";
  dependencies: Dependency[];
  devDependencies?: Dependency[];
}

export interface Dependency {
  name: string;
  version: string;
  versionRange?: string;
  ecosystem: string;
  resolved?: string;
}

export interface DependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, string[]>;
}

export interface GraphNode {
  id: string;
  name: string;
  version: string;
  ecosystem: string;
}

export interface VersionConflict {
  package: string;
  versions: string[];
  requestedBy: string[];
}

export class Resolver {
  private resolvedPackages: Map<string, Package> = new Map();
  private resolutionCache: Map<string, Package> = new Map();

  /**
   * Resolve a package and all its dependencies
   */
  async resolve(
    packageName: string,
    version: string | undefined,
    ecosystem: "npm" | "pypi" | "maven" | "rubygems"
  ): Promise<Package> {
    const cacheKey = `${ecosystem}:${packageName}@${version || "latest"}`;

    // Check cache first
    if (this.resolutionCache.has(cacheKey)) {
      return this.resolutionCache.get(cacheKey)!;
    }

    console.log(`Resolving ${packageName}@${version || "latest"} from ${ecosystem}...`);

    // Fetch package metadata
    const metadata = await this.fetchPackageMetadata(packageName, version, ecosystem);

    // Resolve version if not specified
    const resolvedVersion = version || metadata.latestVersion;

    // Build package object
    const pkg: Package = {
      name: packageName,
      version: resolvedVersion,
      ecosystem,
      dependencies: [],
      devDependencies: [],
    };

    // Resolve dependencies recursively
    if (metadata.dependencies) {
      for (const [depName, depVersion] of Object.entries(metadata.dependencies)) {
        const depEcosystem = await this.detectDependencyEcosystem(depName, ecosystem);
        const resolved = await this.resolve(depName, this.parseVersionRange(depVersion), depEcosystem);

        pkg.dependencies.push({
          name: depName,
          version: resolved.version,
          versionRange: depVersion,
          ecosystem: depEcosystem,
          resolved: resolved.version,
        });
      }
    }

    // Cache the result
    this.resolutionCache.set(cacheKey, pkg);
    this.resolvedPackages.set(`${ecosystem}:${packageName}`, pkg);

    return pkg;
  }

  /**
   * Detect version conflicts in resolved dependencies
   */
  detectConflicts(pkg: Package): VersionConflict[] {
    const conflicts: VersionConflict[] = [];
    const versionMap: Map<string, Map<string, string[]>> = new Map();

    // Build a map of package -> version -> requestedBy
    const collectVersions = (p: Package, parent: string = "root") => {
      for (const dep of p.dependencies) {
        const key = `${dep.ecosystem}:${dep.name}`;

        if (!versionMap.has(key)) {
          versionMap.set(key, new Map());
        }

        const versions = versionMap.get(key)!;
        if (!versions.has(dep.version)) {
          versions.set(dep.version, []);
        }

        versions.get(dep.version)!.push(parent);

        // Recursively check dependencies
        const resolvedDep = this.resolvedPackages.get(key);
        if (resolvedDep) {
          collectVersions(resolvedDep, `${p.name}@${p.version}`);
        }
      }
    };

    collectVersions(pkg);

    // Find conflicts (same package with multiple versions)
    for (const [pkgKey, versions] of versionMap.entries()) {
      if (versions.size > 1) {
        const [, pkgName] = pkgKey.split(":");
        conflicts.push({
          package: pkgName,
          versions: Array.from(versions.keys()),
          requestedBy: Array.from(versions.values()).flat(),
        });
      }
    }

    return conflicts;
  }

  /**
   * Build a dependency graph from packages
   */
  buildGraph(packages: Package[]): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
    };

    const addNode = (pkg: Package) => {
      const id = `${pkg.ecosystem}:${pkg.name}@${pkg.version}`;

      if (!graph.nodes.has(id)) {
        graph.nodes.set(id, {
          id,
          name: pkg.name,
          version: pkg.version,
          ecosystem: pkg.ecosystem,
        });
        graph.edges.set(id, []);
      }

      // Add edges for dependencies
      for (const dep of pkg.dependencies) {
        const depId = `${dep.ecosystem}:${dep.name}@${dep.version}`;
        graph.edges.get(id)!.push(depId);

        // Recursively add dependency nodes
        const resolvedDep = this.resolvedPackages.get(`${dep.ecosystem}:${dep.name}`);
        if (resolvedDep) {
          addNode(resolvedDep);
        }
      }
    };

    for (const pkg of packages) {
      addNode(pkg);
    }

    return graph;
  }

  /**
   * Visualize dependency graph as ASCII tree
   */
  visualizeGraph(graph: DependencyGraph): string {
    const output: string[] = [];
    const visited = new Set<string>();

    const printNode = (nodeId: string, prefix: string = "", isLast: boolean = true) => {
      if (visited.has(nodeId)) {
        output.push(`${prefix}${isLast ? "└─" : "├─"} ${nodeId} (circular)`);
        return;
      }

      visited.add(nodeId);
      const node = graph.nodes.get(nodeId);
      if (!node) return;

      output.push(`${prefix}${isLast ? "└─" : "├─"} [${node.ecosystem}] ${node.name}@${node.version}`);

      const children = graph.edges.get(nodeId) || [];
      const childPrefix = prefix + (isLast ? "   " : "│  ");

      children.forEach((childId, index) => {
        const isLastChild = index === children.length - 1;
        printNode(childId, childPrefix, isLastChild);
      });
    };

    // Print all root nodes (nodes with no incoming edges)
    const roots = this.findRoots(graph);
    roots.forEach((rootId, index) => {
      printNode(rootId, "", index === roots.length - 1);
    });

    return output.join("\n");
  }

  /**
   * Detect circular dependencies
   */
  detectCircular(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = graph.edges.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor);
          cycles.push(cycle);
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Find packages that depend on a given package
   */
  async findDependents(packageName: string): Promise<string[]> {
    const dependents: string[] = [];

    for (const [key, pkg] of this.resolvedPackages.entries()) {
      const hasDependency = pkg.dependencies.some(dep => dep.name === packageName);
      if (hasDependency) {
        dependents.push(pkg.name);
      }
    }

    return dependents;
  }

  /**
   * Resolve version conflicts using various strategies
   */
  resolveConflicts(conflicts: VersionConflict[], strategy: "latest" | "oldest" | "semver" = "latest"): Map<string, string> {
    const resolutions = new Map<string, string>();

    for (const conflict of conflicts) {
      let selectedVersion: string;

      switch (strategy) {
        case "latest":
          selectedVersion = this.selectLatestVersion(conflict.versions);
          break;
        case "oldest":
          selectedVersion = conflict.versions[0];
          break;
        case "semver":
          selectedVersion = this.selectBestSemverMatch(conflict.versions);
          break;
        default:
          selectedVersion = conflict.versions[0];
      }

      resolutions.set(conflict.package, selectedVersion);
    }

    return resolutions;
  }

  /**
   * Calculate dependency depth
   */
  calculateDepth(graph: DependencyGraph, nodeId: string): number {
    let maxDepth = 0;
    const visited = new Set<string>();

    const dfs = (id: string, depth: number) => {
      if (visited.has(id)) return;
      visited.add(id);

      maxDepth = Math.max(maxDepth, depth);

      const neighbors = graph.edges.get(id) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, depth + 1);
      }
    };

    dfs(nodeId, 0);
    return maxDepth;
  }

  private findRoots(graph: DependencyGraph): string[] {
    const hasIncoming = new Set<string>();

    for (const edges of graph.edges.values()) {
      for (const edge of edges) {
        hasIncoming.add(edge);
      }
    }

    const roots: string[] = [];
    for (const nodeId of graph.nodes.keys()) {
      if (!hasIncoming.has(nodeId)) {
        roots.push(nodeId);
      }
    }

    return roots.length > 0 ? roots : Array.from(graph.nodes.keys()).slice(0, 1);
  }

  private async fetchPackageMetadata(
    packageName: string,
    version: string | undefined,
    ecosystem: string
  ): Promise<any> {
    // This would make actual API calls to registries
    // For now, return mock data
    return {
      name: packageName,
      latestVersion: version || "1.0.0",
      dependencies: {},
    };
  }

  private async detectDependencyEcosystem(
    depName: string,
    parentEcosystem: string
  ): Promise<"npm" | "pypi" | "maven" | "rubygems"> {
    // Heuristics for detecting dependency ecosystem
    // Typically dependencies are in the same ecosystem as parent
    return parentEcosystem as any;
  }

  private parseVersionRange(versionSpec: string): string {
    // Parse version ranges (^1.0.0, ~1.0.0, >=1.0.0, etc.)
    // For simplicity, just strip special characters
    return versionSpec.replace(/[\^~>=<]/g, "");
  }

  private selectLatestVersion(versions: string[]): string {
    // Sort versions and return the latest
    // This is a simplified version; should use semver comparison
    return versions.sort((a, b) => {
      const aParts = a.split(".").map(Number);
      const bParts = b.split(".").map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal !== bVal) return bVal - aVal;
      }

      return 0;
    })[0];
  }

  private selectBestSemverMatch(versions: string[]): string {
    // Implement semver-compatible version selection
    // For now, just return the latest
    return this.selectLatestVersion(versions);
  }
}
