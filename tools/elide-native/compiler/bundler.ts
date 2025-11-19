/**
 * Elide Native Compiler - Module Bundler
 *
 * Bundle and optimize modules for native compilation.
 */

import { NativeBridge } from '../runtime/bridge';

export interface BundleOptions {
  entry: string | string[];
  output: string;
  format?: 'esm' | 'cjs' | 'iife';
  target?: 'node' | 'browser' | 'native';
  minify?: boolean;
  sourcemap?: boolean | 'inline' | 'external';
  external?: string[];
  globals?: Record<string, string>;
  plugins?: Plugin[];
  treeshake?: boolean | TreeshakeOptions;
  watch?: boolean;
}

export interface TreeshakeOptions {
  moduleSideEffects?: boolean | ((id: string) => boolean);
  propertyReadSideEffects?: boolean;
  tryCatchDeoptimization?: boolean;
  unknownGlobalSideEffects?: boolean;
}

export interface Plugin {
  name: string;
  resolveId?(source: string, importer?: string): string | null | Promise<string | null>;
  load?(id: string): string | null | Promise<string | null>;
  transform?(code: string, id: string): string | { code: string; map?: any } | Promise<string | { code: string; map?: any }>;
}

export interface BundleResult {
  code: string;
  map?: any;
  modules: ModuleInfo[];
  imports: string[];
  exports: string[];
  size: number;
}

export interface ModuleInfo {
  id: string;
  size: number;
  imports: string[];
  exports: string[];
  isExternal: boolean;
  sideEffects: boolean;
}

export class Bundler {
  private options: BundleOptions;
  private modules: Map<string, ModuleInfo> = new Map();
  private graph: DependencyGraph;

  constructor(options: BundleOptions) {
    this.options = {
      format: 'esm',
      target: 'native',
      minify: true,
      sourcemap: false,
      treeshake: true,
      watch: false,
      ...options,
    };

    this.graph = new DependencyGraph();
  }

  async bundle(): Promise<BundleResult> {
    console.log('Bundling modules...');

    // Step 1: Resolve entry points
    const entries = Array.isArray(this.options.entry) ? this.options.entry : [this.options.entry];
    const resolvedEntries = await this.resolveEntries(entries);

    // Step 2: Build dependency graph
    console.log('Building dependency graph...');
    for (const entry of resolvedEntries) {
      await this.buildGraph(entry);
    }

    // Step 3: Tree shaking
    if (this.options.treeshake) {
      console.log('Tree shaking...');
      await this.performTreeShaking();
    }

    // Step 4: Transform modules
    console.log('Transforming modules...');
    const transformedModules = await this.transformModules();

    // Step 5: Bundle modules
    console.log('Bundling...');
    const bundled = await this.bundleModules(transformedModules);

    // Step 6: Minify
    if (this.options.minify) {
      console.log('Minifying...');
      bundled.code = await this.minify(bundled.code);
    }

    // Step 7: Generate source map
    if (this.options.sourcemap) {
      bundled.map = await this.generateSourceMap(bundled);
    }

    // Step 8: Write output
    await this.writeOutput(bundled);

    console.log(`Bundle size: ${this.formatSize(bundled.size)}`);

    return bundled;
  }

  private async resolveEntries(entries: string[]): Promise<string[]> {
    const resolved: string[] = [];

    for (const entry of entries) {
      // Apply plugins
      let resolvedId = entry;
      if (this.options.plugins) {
        for (const plugin of this.options.plugins) {
          if (plugin.resolveId) {
            const result = await plugin.resolveId(entry);
            if (result) {
              resolvedId = result;
              break;
            }
          }
        }
      }

      // Resolve using native resolver
      if (resolvedId === entry) {
        resolvedId = await NativeBridge.resolveModule(entry);
      }

      resolved.push(resolvedId);
    }

    return resolved;
  }

  private async buildGraph(moduleId: string, importer?: string): Promise<void> {
    if (this.modules.has(moduleId)) {
      return;
    }

    // Check if external
    const isExternal = this.isExternal(moduleId);
    if (isExternal) {
      this.modules.set(moduleId, {
        id: moduleId,
        size: 0,
        imports: [],
        exports: [],
        isExternal: true,
        sideEffects: false,
      });
      return;
    }

    // Load module
    let code = await this.loadModule(moduleId);

    // Apply plugins
    if (this.options.plugins) {
      for (const plugin of this.options.plugins) {
        if (plugin.transform) {
          const result = await plugin.transform(code, moduleId);
          code = typeof result === 'string' ? result : result.code;
        }
      }
    }

    // Parse module
    const parsed = await NativeBridge.parseModule(code, moduleId);

    // Create module info
    const moduleInfo: ModuleInfo = {
      id: moduleId,
      size: code.length,
      imports: parsed.imports,
      exports: parsed.exports,
      isExternal: false,
      sideEffects: parsed.sideEffects,
    };

    this.modules.set(moduleId, moduleInfo);
    this.graph.addNode(moduleId);

    if (importer) {
      this.graph.addEdge(importer, moduleId);
    }

    // Process imports
    for (const importPath of parsed.imports) {
      const resolvedImport = await this.resolveImport(importPath, moduleId);
      await this.buildGraph(resolvedImport, moduleId);
    }
  }

  private async loadModule(moduleId: string): Promise<string> {
    // Try plugins first
    if (this.options.plugins) {
      for (const plugin of this.options.plugins) {
        if (plugin.load) {
          const result = await plugin.load(moduleId);
          if (result) {
            return result;
          }
        }
      }
    }

    // Load from file system
    return NativeBridge.readFile(moduleId, 'utf8');
  }

  private async resolveImport(importPath: string, importer: string): Promise<string> {
    // Try plugins first
    if (this.options.plugins) {
      for (const plugin of this.options.plugins) {
        if (plugin.resolveId) {
          const result = await plugin.resolveId(importPath, importer);
          if (result) {
            return result;
          }
        }
      }
    }

    // Use native resolver
    return NativeBridge.resolveImport(importPath, importer);
  }

  private isExternal(moduleId: string): boolean {
    if (!this.options.external) return false;

    for (const external of this.options.external) {
      if (moduleId === external || moduleId.startsWith(external + '/')) {
        return true;
      }
    }

    return false;
  }

  private async performTreeShaking(): Promise<void> {
    const treeshakeOptions = typeof this.options.treeshake === 'boolean'
      ? {}
      : this.options.treeshake;

    await NativeBridge.treeShakeModules(
      Array.from(this.modules.values()),
      this.graph,
      treeshakeOptions
    );
  }

  private async transformModules(): Promise<Map<string, string>> {
    const transformed = new Map<string, string>();

    for (const [id, info] of this.modules) {
      if (info.isExternal) continue;

      const code = await this.loadModule(id);
      const transformedCode = await NativeBridge.transformModule(code, {
        format: this.options.format,
        target: this.options.target,
      });

      transformed.set(id, transformedCode);
    }

    return transformed;
  }

  private async bundleModules(modules: Map<string, string>): Promise<BundleResult> {
    let bundledCode = '';

    // Add header
    bundledCode += this.generateHeader();

    // Add runtime if needed
    if (this.options.format === 'iife') {
      bundledCode += this.generateRuntime();
    }

    // Add modules
    for (const [id, code] of modules) {
      bundledCode += `\n// Module: ${id}\n`;
      bundledCode += code;
      bundledCode += '\n';
    }

    // Add footer
    bundledCode += this.generateFooter();

    return {
      code: bundledCode,
      modules: Array.from(this.modules.values()).filter(m => !m.isExternal),
      imports: this.getExternalImports(),
      exports: this.getExports(),
      size: bundledCode.length,
    };
  }

  private generateHeader(): string {
    if (this.options.format === 'iife') {
      return '(function() {\n"use strict";\n';
    }
    return '';
  }

  private generateFooter(): string {
    if (this.options.format === 'iife') {
      return '\n})();';
    }
    return '';
  }

  private generateRuntime(): string {
    // Minimal runtime for module system
    return `
var __modules = {};
var __cache = {};

function __require(id) {
  if (__cache[id]) return __cache[id].exports;

  var module = __cache[id] = { exports: {} };
  __modules[id](module, module.exports, __require);

  return module.exports;
}
`;
  }

  private getExternalImports(): string[] {
    const externals = new Set<string>();

    for (const [id, info] of this.modules) {
      if (info.isExternal) {
        externals.add(id);
      }
    }

    return Array.from(externals);
  }

  private getExports(): string[] {
    const entries = Array.isArray(this.options.entry) ? this.options.entry : [this.options.entry];
    const exports = new Set<string>();

    for (const entry of entries) {
      const module = this.modules.get(entry);
      if (module) {
        for (const exp of module.exports) {
          exports.add(exp);
        }
      }
    }

    return Array.from(exports);
  }

  private async minify(code: string): Promise<string> {
    return NativeBridge.minifyCode(code);
  }

  private async generateSourceMap(bundle: BundleResult): Promise<any> {
    return NativeBridge.generateSourceMap(bundle);
  }

  private async writeOutput(bundle: BundleResult): Promise<void> {
    await NativeBridge.writeFile(this.options.output, bundle.code, 'utf8');

    if (bundle.map && this.options.sourcemap === 'external') {
      await NativeBridge.writeFile(
        this.options.output + '.map',
        JSON.stringify(bundle.map),
        'utf8'
      );
    }
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

class DependencyGraph {
  private nodes: Set<string> = new Set();
  private edges: Map<string, Set<string>> = new Map();

  addNode(id: string): void {
    this.nodes.add(id);
    if (!this.edges.has(id)) {
      this.edges.set(id, new Set());
    }
  }

  addEdge(from: string, to: string): void {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from)!.add(to);
  }

  getDependencies(id: string): string[] {
    return Array.from(this.edges.get(id) || []);
  }

  topologicalSort(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const deps = this.getDependencies(id);
      for (const dep of deps) {
        visit(dep);
      }

      result.push(id);
    };

    for (const node of this.nodes) {
      visit(node);
    }

    return result;
  }
}

export async function bundle(options: BundleOptions): Promise<BundleResult> {
  const bundler = new Bundler(options);
  return bundler.bundle();
}
