/**
 * Rollup Clone - Code Splitter
 *
 * Splits code into optimized chunks with smart grouping.
 */

import type { OutputOptions } from '../types';
import type { ModuleGraph, Module } from './moduleGraph';
import { basename, extname } from 'path';

export interface Chunk {
  type: 'chunk';
  code: string;
  map?: any;
  fileName: string;
  name: string;
  facadeModuleId?: string;
  isDynamicEntry?: boolean;
  isEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  modules?: Record<string, any>;
  exports?: string[];
}

export class CodeSplitter {
  private options: OutputOptions;
  private moduleGraph: ModuleGraph;

  constructor(options: OutputOptions, moduleGraph: ModuleGraph) {
    this.options = options;
    this.moduleGraph = moduleGraph;
  }

  async split(): Promise<Chunk[]> {
    const chunks: Chunk[] = [];

    if (this.options.inlineDynamicImports || this.options.preserveModules) {
      return this.createPreservedModuleChunks();
    }

    // Get entry modules
    const entries = this.moduleGraph.getEntries();

    // Create chunks for each entry
    for (const entry of entries) {
      const chunk = await this.createChunk(entry, entries);
      chunks.push(chunk);
    }

    // Apply manual chunks
    if (this.options.manualChunks) {
      const manualChunks = await this.createManualChunks();
      chunks.push(...manualChunks);
    }

    return chunks;
  }

  private async createChunk(entry: Module, allEntries: Module[]): Promise<Chunk> {
    const includedModules = new Set<Module>();
    const queue = [entry];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const module = queue.shift()!;

      if (visited.has(module.id)) continue;
      visited.add(module.id);

      if (module.removed) continue;

      includedModules.add(module);

      // Follow imports
      for (const [importId] of module.imports) {
        const imported = this.moduleGraph.getModuleById(importId);
        if (imported && !imported.external) {
          queue.push(imported);
        }
      }
    }

    // Generate chunk code
    let code = this.generateChunkCode(includedModules);

    const fileName = this.getChunkFileName(entry);

    return {
      type: 'chunk',
      code,
      fileName,
      name: this.getChunkName(entry),
      facadeModuleId: entry.id,
      isEntry: entry.isEntry,
      imports: [],
      dynamicImports: [],
      modules: {},
      exports: Array.from(entry.exports.keys()),
    };
  }

  private generateChunkCode(modules: Set<Module>): string {
    let code = '';

    // Add banner
    if (this.options.banner) {
      code += this.options.banner + '\n\n';
    }

    // Add intro
    if (this.options.intro) {
      code += this.options.intro + '\n\n';
    }

    // Generate code based on format
    const format = this.options.format;

    if (format === 'esm') {
      code += this.generateESMCode(modules);
    } else if (format === 'cjs') {
      code += this.generateCJSCode(modules);
    } else if (format === 'umd') {
      code += this.generateUMDCode(modules);
    } else if (format === 'iife') {
      code += this.generateIIFECode(modules);
    }

    // Add outro
    if (this.options.outro) {
      code += '\n\n' + this.options.outro;
    }

    // Add footer
    if (this.options.footer) {
      code += '\n\n' + this.options.footer;
    }

    return code;
  }

  private generateESMCode(modules: Set<Module>): string {
    let code = '';

    for (const module of modules) {
      code += `\n// ${module.id}\n`;
      code += module.code + '\n';
    }

    return code;
  }

  private generateCJSCode(modules: Set<Module>): string {
    let code = "'use strict';\n\n";

    for (const module of modules) {
      code += `\n// ${module.id}\n`;
      // Convert ESM to CJS
      let moduleCode = module.code;
      moduleCode = moduleCode.replace(/export\s+default\s+/g, 'module.exports = ');
      moduleCode = moduleCode.replace(/export\s+/g, 'module.exports.');
      moduleCode = moduleCode.replace(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g, "const $1 = require('$1')");
      code += moduleCode + '\n';
    }

    return code;
  }

  private generateUMDCode(modules: Set<Module>): string {
    const name = this.options.name || 'MyLibrary';
    const globals = this.options.globals || {};

    let code = `(function (global, factory) {\n`;
    code += `  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :\n`;
    code += `  typeof define === 'function' && define.amd ? define(['exports'], factory) :\n`;
    code += `  (global = global || self, factory(global.${name} = {}));\n`;
    code += `}(this, (function (exports) { 'use strict';\n\n`;

    for (const module of modules) {
      code += `\n// ${module.id}\n`;
      code += module.code + '\n';
    }

    code += `\n})));\n`;

    return code;
  }

  private generateIIFECode(modules: Set<Module>): string {
    const name = this.options.name || 'MyLibrary';

    let code = `var ${name} = (function () {\n`;
    code += `  'use strict';\n\n`;

    for (const module of modules) {
      code += `\n// ${module.id}\n`;
      code += module.code + '\n';
    }

    code += `\n  return exports;\n`;
    code += `})();\n`;

    return code;
  }

  private createPreservedModuleChunks(): Chunk[] {
    const chunks: Chunk[] = [];

    for (const module of this.moduleGraph.getModules()) {
      if (module.external || module.removed) continue;

      const chunk: Chunk = {
        type: 'chunk',
        code: module.code,
        fileName: this.getModuleFileName(module),
        name: this.getChunkName(module),
        facadeModuleId: module.id,
        isEntry: module.isEntry,
        imports: [],
        dynamicImports: [],
        modules: {},
        exports: Array.from(module.exports.keys()),
      };

      chunks.push(chunk);
    }

    return chunks;
  }

  private async createManualChunks(): Promise<Chunk[]> {
    // Implementation for manual chunks
    return [];
  }

  private getChunkName(module: Module): string {
    return basename(module.id, extname(module.id));
  }

  private getChunkFileName(module: Module): string {
    const name = this.getChunkName(module);
    const template = module.isEntry ? this.options.entryFileNames : this.options.chunkFileNames;
    return template!.replace('[name]', name).replace('[hash]', this.generateHash(module.code));
  }

  private getModuleFileName(module: Module): string {
    return module.id.replace(this.options.preserveModulesRoot || '', '').slice(1);
  }

  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }
}
