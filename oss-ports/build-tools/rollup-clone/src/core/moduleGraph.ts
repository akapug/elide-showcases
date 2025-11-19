/**
 * Rollup Clone - Module Graph
 *
 * Manages module relationships, dependencies, and metadata.
 */

import { resolve, relative, extname, dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import type { InputOptions } from '../types';
import type { PluginDriver } from './pluginDriver';

/**
 * Module interface
 */
export interface Module {
  id: string;
  code: string;
  originalCode: string;
  isEntry: boolean;
  external: boolean;
  imports: Map<string, Set<string>>;
  exports: Map<string, ExportInfo>;
  dynamicImports: Set<string>;
  removed?: boolean;
  meta?: any;
}

/**
 * Export info
 */
export interface ExportInfo {
  name: string;
  type: 'local' | 're-export' | 'external';
  source?: string;
  imported?: string;
  removed?: boolean;
}

/**
 * Module graph implementation
 */
export class ModuleGraph {
  private modules: Map<string, Module> = new Map();
  private entries: Map<string, string> = new Map();
  private queue: string[] = [];
  private processing: Set<string> = new Set();
  private options: InputOptions;
  private pluginDriver: PluginDriver;

  constructor(options: InputOptions, pluginDriver: PluginDriver) {
    this.options = options;
    this.pluginDriver = pluginDriver;
  }

  /**
   * Add entry module
   */
  async addEntry(name: string, id: string): Promise<void> {
    this.entries.set(name, id);
    this.queue.push(id);
  }

  /**
   * Process module queue
   */
  async process(): Promise<void> {
    while (this.queue.length > 0) {
      const id = this.queue.shift()!;

      if (this.processing.has(id) || this.modules.has(id)) {
        continue;
      }

      this.processing.add(id);

      try {
        await this.loadModule(id);
      } catch (error) {
        console.error(`Failed to load module ${id}:`, error);
        throw error;
      }

      this.processing.delete(id);
    }
  }

  /**
   * Load and parse module
   */
  private async loadModule(id: string): Promise<void> {
    // Check if external
    const isExternal = this.isExternal(id);

    if (isExternal) {
      this.modules.set(id, {
        id,
        code: '',
        originalCode: '',
        isEntry: this.isEntry(id),
        external: true,
        imports: new Map(),
        exports: new Map(),
        dynamicImports: new Set(),
      });
      return;
    }

    // Resolve module ID
    const resolved = await this.resolveId(id);
    if (!resolved) {
      throw new Error(`Cannot resolve module: ${id}`);
    }

    // Load module code
    let code = await this.loadCode(resolved);

    // Transform module code
    const transformed = await this.transformCode(code, resolved);
    if (transformed) {
      code = transformed;
    }

    // Parse imports and exports
    const imports = this.parseImports(code);
    const exports = this.parseExports(code);
    const dynamicImports = this.parseDynamicImports(code);

    // Create module
    const module: Module = {
      id: resolved,
      code,
      originalCode: code,
      isEntry: this.isEntry(resolved),
      external: false,
      imports,
      exports,
      dynamicImports,
    };

    this.modules.set(resolved, module);

    // Add imports to queue
    for (const [importedId] of imports) {
      if (!this.modules.has(importedId)) {
        this.queue.push(importedId);
      }
    }

    // Add dynamic imports to queue
    for (const dynamicId of dynamicImports) {
      if (!this.modules.has(dynamicId)) {
        this.queue.push(dynamicId);
      }
    }
  }

  /**
   * Resolve module ID
   */
  private async resolveId(id: string): Promise<string | null> {
    // Use plugin driver to resolve
    const resolved = await this.pluginDriver.hookFirst('resolveId', id, undefined);

    if (resolved) {
      if (typeof resolved === 'string') {
        return resolved;
      }
      return resolved.id;
    }

    // Default resolution
    if (id.startsWith('.') || id.startsWith('/')) {
      const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.mjs'];

      for (const ext of extensions) {
        const fullPath = id + ext;
        if (existsSync(fullPath)) {
          return resolve(fullPath);
        }
      }

      if (existsSync(id)) {
        return resolve(id);
      }
    }

    return null;
  }

  /**
   * Load module code
   */
  private async loadCode(id: string): Promise<string> {
    // Use plugin driver to load
    const loaded = await this.pluginDriver.hookFirst('load', id);

    if (loaded) {
      if (typeof loaded === 'string') {
        return loaded;
      }
      return loaded.code;
    }

    // Default load from file system
    if (existsSync(id)) {
      return readFileSync(id, 'utf-8');
    }

    throw new Error(`Cannot load module: ${id}`);
  }

  /**
   * Transform module code
   */
  private async transformCode(code: string, id: string): Promise<string | null> {
    // Use plugin driver to transform
    const transformed = await this.pluginDriver.hookSeq('transform', code, id);

    if (transformed) {
      if (typeof transformed === 'string') {
        return transformed;
      }
      return transformed.code;
    }

    return null;
  }

  /**
   * Parse imports from code
   */
  private parseImports(code: string): Map<string, Set<string>> {
    const imports = new Map<string, Set<string>>();

    // Static imports: import { x, y } from 'module'
    const importRegex = /import\s+(?:(?:\*\s+as\s+\w+)|(?:{([^}]+)})|(?:(\w+)))\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      const [, namedImports, defaultImport, source] = match;

      if (!imports.has(source)) {
        imports.set(source, new Set());
      }

      const importSet = imports.get(source)!;

      if (namedImports) {
        // Named imports
        const names = namedImports.split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
        names.forEach(name => importSet.add(name));
      }

      if (defaultImport) {
        importSet.add('default');
      }
    }

    // Namespace imports: import * as ns from 'module'
    const namespaceRegex = /import\s+\*\s+as\s+\w+\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = namespaceRegex.exec(code)) !== null) {
      const source = match[1];
      if (!imports.has(source)) {
        imports.set(source, new Set());
      }
      imports.get(source)!.add('*');
    }

    return imports;
  }

  /**
   * Parse exports from code
   */
  private parseExports(code: string): Map<string, ExportInfo> {
    const exports = new Map<string, ExportInfo>();

    // Named exports: export const x = ...
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;

    while ((match = namedExportRegex.exec(code)) !== null) {
      const name = match[1];
      exports.set(name, {
        name,
        type: 'local',
      });
    }

    // Export list: export { x, y }
    const exportListRegex = /export\s+{([^}]+)}/g;
    while ((match = exportListRegex.exec(code)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      names.forEach(name => {
        exports.set(name, {
          name,
          type: 'local',
        });
      });
    }

    // Default export
    if (/export\s+default/.test(code)) {
      exports.set('default', {
        name: 'default',
        type: 'local',
      });
    }

    // Re-exports: export { x } from 'module'
    const reExportRegex = /export\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = reExportRegex.exec(code)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      const source = match[2];
      names.forEach(name => {
        exports.set(name, {
          name,
          type: 're-export',
          source,
          imported: name,
        });
      });
    }

    return exports;
  }

  /**
   * Parse dynamic imports
   */
  private parseDynamicImports(code: string): Set<string> {
    const dynamicImports = new Set<string>();

    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;

    while ((match = dynamicImportRegex.exec(code)) !== null) {
      dynamicImports.add(match[1]);
    }

    return dynamicImports;
  }

  /**
   * Check if module is external
   */
  private isExternal(id: string): boolean {
    const external = this.options.external;

    if (!external) return false;

    if (Array.isArray(external)) {
      return external.some(ext => {
        if (typeof ext === 'string') {
          return id === ext || id.startsWith(ext + '/');
        }
        if (ext instanceof RegExp) {
          return ext.test(id);
        }
        return false;
      });
    }

    if (typeof external === 'function') {
      return external(id, undefined, false);
    }

    return false;
  }

  /**
   * Check if module is entry
   */
  private isEntry(id: string): boolean {
    for (const entryId of this.entries.values()) {
      if (id === entryId) return true;
    }
    return false;
  }

  /**
   * Get all modules
   */
  getModules(): IterableIterator<Module> {
    return this.modules.values();
  }

  /**
   * Get module by ID
   */
  getModuleById(id: string): Module | undefined {
    return this.modules.get(id);
  }

  /**
   * Get entry modules
   */
  getEntries(): Module[] {
    const entries: Module[] = [];
    for (const entryId of this.entries.values()) {
      const module = this.modules.get(entryId);
      if (module) {
        entries.push(module);
      }
    }
    return entries;
  }

  /**
   * Get watch files
   */
  getWatchFiles(): string[] {
    const files: string[] = [];
    for (const module of this.modules.values()) {
      if (!module.external) {
        files.push(module.id);
      }
    }
    return files;
  }

  /**
   * Get cache modules
   */
  getCacheModules(): any[] {
    return Array.from(this.modules.values()).map(mod => ({
      id: mod.id,
      code: mod.code,
      meta: mod.meta,
    }));
  }
}
