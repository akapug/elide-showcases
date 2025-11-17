/**
 * Rollup Clone - Tree Shaker
 *
 * Advanced tree shaking with dead code elimination,
 * side effect analysis, and cross-module optimization.
 */

import type { ModuleGraph, Module } from './moduleGraph';
import type { TreeshakeOptions } from '../types';

/**
 * Tree shaker implementation
 */
export class TreeShaker {
  private options: TreeshakeOptions;
  private usedExports: Map<string, Set<string>> = new Map();
  private pureModules: Set<string> = new Set();
  private sideEffectModules: Set<string> = new Set();

  constructor(options: TreeshakeOptions | false) {
    this.options = options === false ? this.getDisabledOptions() : options;
  }

  /**
   * Get disabled options
   */
  private getDisabledOptions(): TreeshakeOptions {
    return {
      moduleSideEffects: 'no-treeshake',
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
      unknownGlobalSideEffects: false,
    };
  }

  /**
   * Perform tree shaking on module graph
   */
  async shake(moduleGraph: ModuleGraph): Promise<void> {
    console.log('Starting tree shaking...');

    if (this.options.moduleSideEffects === 'no-treeshake') {
      console.log('Tree shaking disabled');
      return;
    }

    // Mark entry modules
    const entries = moduleGraph.getEntries();
    for (const entry of entries) {
      this.markModuleUsed(entry, moduleGraph);
    }

    // Mark used exports
    for (const module of moduleGraph.getModules()) {
      await this.analyzeModule(module, moduleGraph);
    }

    // Remove unused code
    this.removeUnusedCode(moduleGraph);

    console.log(`Tree shaking complete. Removed ${this.countRemovedExports(moduleGraph)} unused exports`);
  }

  /**
   * Mark module as used
   */
  private markModuleUsed(module: Module, moduleGraph: ModuleGraph): void {
    if (!this.usedExports.has(module.id)) {
      this.usedExports.set(module.id, new Set());
    }

    // Mark all exports as used for entry modules
    if (module.isEntry) {
      const exports = this.usedExports.get(module.id)!;
      for (const exportName of module.exports.keys()) {
        exports.add(exportName);
      }
    }

    // Follow imports
    for (const [importedId, imports] of module.imports) {
      const importedModule = moduleGraph.getModuleById(importedId);
      if (importedModule) {
        this.markImportsUsed(importedModule, imports, moduleGraph);
      }
    }
  }

  /**
   * Mark imports as used
   */
  private markImportsUsed(
    module: Module,
    imports: Set<string>,
    moduleGraph: ModuleGraph,
  ): void {
    if (!this.usedExports.has(module.id)) {
      this.usedExports.set(module.id, new Set());
    }

    const exports = this.usedExports.get(module.id)!;

    for (const importName of imports) {
      exports.add(importName);

      // If importing *, mark all exports as used
      if (importName === '*') {
        for (const exportName of module.exports.keys()) {
          exports.add(exportName);
        }
      }

      // Follow re-exports
      const exportInfo = module.exports.get(importName);
      if (exportInfo?.type === 're-export') {
        const sourceModule = moduleGraph.getModuleById(exportInfo.source!);
        if (sourceModule) {
          this.markImportsUsed(sourceModule, new Set([exportInfo.imported!]), moduleGraph);
        }
      }
    }
  }

  /**
   * Analyze module for side effects
   */
  private async analyzeModule(module: Module, moduleGraph: ModuleGraph): Promise<void> {
    // Check for side effects
    const hasSideEffects = this.checkSideEffects(module);

    if (hasSideEffects) {
      this.sideEffectModules.add(module.id);
      this.markModuleUsed(module, moduleGraph);
    } else {
      this.pureModules.add(module.id);
    }
  }

  /**
   * Check if module has side effects
   */
  private checkSideEffects(module: Module): boolean {
    // Check package.json sideEffects field
    if (this.options.moduleSideEffects !== true) {
      if (typeof this.options.moduleSideEffects === 'function') {
        const result = this.options.moduleSideEffects(module.id, module.external);
        if (result === false) {
          return false;
        }
      }
    }

    // Analyze code for side effects
    const code = module.code;

    // Check for top-level statements
    if (this.hasTopLevelSideEffects(code)) {
      return true;
    }

    // Check for property read side effects
    if (this.options.propertyReadSideEffects) {
      if (this.hasPropertyReadSideEffects(code)) {
        return true;
      }
    }

    // Check for unknown global side effects
    if (this.options.unknownGlobalSideEffects) {
      if (this.hasUnknownGlobalSideEffects(code)) {
        return true;
      }
    }

    // Check for try-catch
    if (this.options.tryCatchDeoptimization) {
      if (code.includes('try') && code.includes('catch')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for top-level side effects
   */
  private hasTopLevelSideEffects(code: string): boolean {
    // Simplified side effect detection
    // In production, would use AST analysis

    // Direct function calls at top level (excluding IIFE definitions)
    const directCalls = /^[^=]*\w+\([^)]*\);/gm;
    if (directCalls.test(code)) {
      return true;
    }

    // Property assignments
    const propertyAssignments = /\w+\.\w+\s*=/g;
    if (propertyAssignments.test(code)) {
      return true;
    }

    // console.*
    if (code.includes('console.')) {
      return true;
    }

    return false;
  }

  /**
   * Check for property read side effects
   */
  private hasPropertyReadSideEffects(code: string): boolean {
    // Check for getters that might have side effects
    // In production, would use AST to detect actual getters

    // For now, assume property reads are safe
    return false;
  }

  /**
   * Check for unknown global side effects
   */
  private hasUnknownGlobalSideEffects(code: string): boolean {
    // Check for access to global objects
    const globalAccess = /(window|global|self|document|process)\./g;
    return globalAccess.test(code);
  }

  /**
   * Remove unused code from modules
   */
  private removeUnusedCode(moduleGraph: ModuleGraph): void {
    for (const module of moduleGraph.getModules()) {
      const usedExports = this.usedExports.get(module.id);

      if (!usedExports || usedExports.size === 0) {
        // Module is completely unused
        if (!this.sideEffectModules.has(module.id)) {
          module.removed = true;
          continue;
        }
      }

      // Remove unused exports
      for (const [exportName, exportInfo] of module.exports) {
        if (!usedExports?.has(exportName)) {
          exportInfo.removed = true;
        }
      }

      // Update module code
      module.code = this.removeUnusedExportsFromCode(module.code, module.exports);
    }
  }

  /**
   * Remove unused exports from code
   */
  private removeUnusedExportsFromCode(code: string, exports: Map<string, ExportInfo>): string {
    let modifiedCode = code;

    for (const [exportName, exportInfo] of exports) {
      if (exportInfo.removed) {
        // Remove export statement
        // Simplified removal - in production would use AST manipulation
        const exportRegex = new RegExp(`export\\s+(const|let|var|function|class)\\s+${exportName}\\b[^;]*;`, 'g');
        modifiedCode = modifiedCode.replace(exportRegex, '');

        const namedExportRegex = new RegExp(`export\\s+\\{[^}]*\\b${exportName}\\b[^}]*\\}`, 'g');
        modifiedCode = modifiedCode.replace(namedExportRegex, '');
      }
    }

    return modifiedCode;
  }

  /**
   * Count removed exports
   */
  private countRemovedExports(moduleGraph: ModuleGraph): number {
    let count = 0;

    for (const module of moduleGraph.getModules()) {
      for (const exportInfo of module.exports.values()) {
        if (exportInfo.removed) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Check if export is pure
   */
  isPureExport(module: Module, exportName: string): boolean {
    const exportInfo = module.exports.get(exportName);
    if (!exportInfo) return false;

    // Check for /*#__PURE__*/ annotation
    const code = module.code;
    const exportIndex = code.indexOf(`export ${exportName}`);
    if (exportIndex !== -1) {
      const before = code.slice(Math.max(0, exportIndex - 100), exportIndex);
      if (before.includes('/*#__PURE__*/')) {
        return true;
      }
    }

    return false;
  }
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
