/**
 * Tree Shaker
 *
 * Eliminates dead code from the bundle using:
 * - Static analysis of imports/exports
 * - Side effect detection
 * - DCE (Dead Code Elimination)
 * - Pure function annotation
 */

import { ModuleInfo } from "./module-graph";

export interface TreeShakeOptions {
  moduleSideEffects?: boolean | ((id: string) => boolean);
  treeshake?: boolean | TreeShakeConfig;
  pureExternalModules?: boolean;
  propertyReadSideEffects?: boolean;
}

export interface TreeShakeConfig {
  annotations?: boolean;
  moduleSideEffects?: boolean | ((id: string) => boolean);
  propertyReadSideEffects?: boolean;
  tryCatchDeoptimization?: boolean;
  unknownGlobalSideEffects?: boolean;
}

export interface ShakeResult {
  usedExports: Set<string>;
  usedModules: Set<string>;
  removedExports: Set<string>;
  removedModules: Set<string>;
  sideEffectModules: Set<string>;
  bytesRemoved: number;
}

export class TreeShaker {
  private options: TreeShakeOptions;
  private usedExports: Map<string, Set<string>> = new Map();
  private sideEffectModules: Set<string> = new Set();
  private pureAnnotations: Map<string, boolean> = new Map();

  constructor(options: TreeShakeOptions = {}) {
    this.options = {
      moduleSideEffects: options.moduleSideEffects ?? true,
      treeshake: options.treeshake ?? true,
      pureExternalModules: options.pureExternalModules ?? false,
      propertyReadSideEffects: options.propertyReadSideEffects ?? true,
    };
  }

  /**
   * Shake the module tree to remove unused code
   */
  shake(modules: ModuleInfo[], entryPoints: string[]): ShakeResult {
    const usedModules = new Set<string>();
    const usedExports = new Set<string>();
    const sideEffectModules = new Set<string>();

    // Start from entry points and traverse
    for (const entry of entryPoints) {
      this.markModuleAsUsed(entry, modules, usedModules, usedExports, sideEffectModules);
    }

    // Calculate removed modules and exports
    const allModules = new Set(modules.map((m) => m.id));
    const allExports = new Set<string>();
    for (const module of modules) {
      for (const exp of module.exports) {
        allExports.add(`${module.id}::${exp}`);
      }
    }

    const removedModules = new Set(
      Array.from(allModules).filter((m) => !usedModules.has(m))
    );

    const removedExports = new Set(
      Array.from(allExports).filter((e) => !usedExports.has(e))
    );

    // Calculate bytes removed
    let bytesRemoved = 0;
    for (const module of modules) {
      if (removedModules.has(module.id)) {
        bytesRemoved += module.size;
      }
    }

    return {
      usedExports,
      usedModules,
      removedExports,
      removedModules,
      sideEffectModules,
      bytesRemoved,
    };
  }

  /**
   * Mark a module and its dependencies as used
   */
  private markModuleAsUsed(
    moduleId: string,
    modules: ModuleInfo[],
    usedModules: Set<string>,
    usedExports: Set<string>,
    sideEffectModules: Set<string>
  ): void {
    if (usedModules.has(moduleId)) {
      return; // Already processed
    }

    const module = modules.find((m) => m.id === moduleId);
    if (!module) {
      return;
    }

    usedModules.add(moduleId);

    // Check for side effects
    if (this.hasSideEffects(module)) {
      sideEffectModules.add(moduleId);
    }

    // Mark all exports as used if module has side effects
    if (module.sideEffects) {
      for (const exp of module.exports) {
        usedExports.add(`${moduleId}::${exp}`);
      }
    }

    // Process dependencies
    for (const dep of module.dependencies) {
      this.markModuleAsUsed(dep, modules, usedModules, usedExports, sideEffectModules);
    }

    // Process dynamic dependencies
    for (const dep of module.dynamicDependencies) {
      this.markModuleAsUsed(dep, modules, usedModules, usedExports, sideEffectModules);
    }

    // Mark specific imports as used
    for (const [importSource, importedNames] of module.imports) {
      for (const name of importedNames) {
        usedExports.add(`${importSource}::${name}`);
      }
    }
  }

  /**
   * Check if a module has side effects
   */
  private hasSideEffects(module: ModuleInfo): boolean {
    // External modules
    if (module.isExternal) {
      return !this.options.pureExternalModules;
    }

    // Explicit side effects flag
    if (typeof module.sideEffects === "boolean") {
      return module.sideEffects;
    }

    // Check module side effects option
    if (typeof this.options.moduleSideEffects === "function") {
      return this.options.moduleSideEffects(module.id);
    }

    if (typeof this.options.moduleSideEffects === "boolean") {
      return this.options.moduleSideEffects;
    }

    // Default to true (conservative)
    return true;
  }

  /**
   * Analyze code for pure annotations
   */
  analyzePureAnnotations(code: string, moduleId: string): void {
    // Look for /*#__PURE__*/ comments
    const pureRegex = /\/\*\s*#__PURE__\s*\*\//g;
    const matches = code.matchAll(pureRegex);

    for (const match of matches) {
      const index = match.index!;
      // Extract the function call after the pure annotation
      const afterComment = code.slice(index + match[0].length).trim();
      const functionMatch = afterComment.match(/^(\w+)\(/);

      if (functionMatch) {
        const functionName = functionMatch[1];
        this.pureAnnotations.set(`${moduleId}::${functionName}`, true);
      }
    }
  }

  /**
   * Check if a function is marked as pure
   */
  isPure(moduleId: string, functionName: string): boolean {
    return this.pureAnnotations.get(`${moduleId}::${functionName}`) || false;
  }

  /**
   * Eliminate unused exports from code
   */
  eliminateUnusedExports(code: string, moduleId: string, usedExports: Set<string>): string {
    // This is a simplified implementation
    // A production tree shaker would use an AST parser
    let result = code;

    // Remove unused export statements
    const exportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    const matches = Array.from(code.matchAll(exportRegex));

    for (const match of matches.reverse()) {
      const exportName = match[1];
      const fullExportId = `${moduleId}::${exportName}`;

      if (!usedExports.has(fullExportId)) {
        // Remove the export keyword but keep the declaration
        const start = match.index!;
        const exportKeyword = match[0].match(/export\s+/)![0];
        result = result.slice(0, start) + result.slice(start + exportKeyword.length);
      }
    }

    return result;
  }

  /**
   * Perform dead code elimination
   */
  eliminateDeadCode(code: string): string {
    let result = code;

    // Remove unreachable code after return statements
    result = result.replace(
      /return\s+[^;]+;[\s\n]*(?!})[^}]+/g,
      (match) => {
        const returnStatement = match.match(/return\s+[^;]+;/)![0];
        return returnStatement;
      }
    );

    // Remove unused variables (simple heuristic)
    const varRegex = /(?:const|let|var)\s+(\w+)\s*=/g;
    const varMatches = Array.from(result.matchAll(varRegex));

    for (const match of varMatches.reverse()) {
      const varName = match[1];
      const afterDeclaration = result.slice(match.index! + match[0].length);

      // Count usages
      const usageRegex = new RegExp(`\\b${varName}\\b`, "g");
      const usages = afterDeclaration.match(usageRegex);

      if (!usages || usages.length === 0) {
        // Variable is never used, remove it
        const lineStart = result.lastIndexOf("\n", match.index!) + 1;
        const lineEnd = result.indexOf("\n", match.index!);
        result = result.slice(0, lineStart) + result.slice(lineEnd + 1);
      }
    }

    // Remove empty if statements
    result = result.replace(/if\s*\([^)]+\)\s*{\s*}/g, "");

    // Remove dead if branches (if (false) {...})
    result = result.replace(/if\s*\(\s*false\s*\)\s*{[^}]*}/g, "");

    // Keep only true branches (if (true) {...} -> {...})
    result = result.replace(/if\s*\(\s*true\s*\)\s*{([^}]*)}/g, "$1");

    return result;
  }

  /**
   * Optimize constant folding
   */
  foldConstants(code: string): string {
    let result = code;

    // Fold simple arithmetic
    result = result.replace(/(\d+)\s*\+\s*(\d+)/g, (match, a, b) =>
      String(Number(a) + Number(b))
    );
    result = result.replace(/(\d+)\s*-\s*(\d+)/g, (match, a, b) =>
      String(Number(a) - Number(b))
    );
    result = result.replace(/(\d+)\s*\*\s*(\d+)/g, (match, a, b) =>
      String(Number(a) * Number(b))
    );

    // Fold string concatenation
    result = result.replace(/'([^']*)'\s*\+\s*'([^']*)'/g, "'$1$2'");
    result = result.replace(/"([^"]*)"\s*\+\s*"([^"]*)"/g, '"$1$2"');

    // Fold boolean operations
    result = result.replace(/true\s*&&\s*true/g, "true");
    result = result.replace(/false\s*\|\|\s*false/g, "false");
    result = result.replace(/!true/g, "false");
    result = result.replace(/!false/g, "true");

    return result;
  }

  /**
   * Get statistics about tree shaking
   */
  getStats(result: ShakeResult): string {
    const totalModules = result.usedModules.size + result.removedModules.size;
    const totalExports = result.usedExports.size + result.removedExports.size;

    const modulesRemoved = result.removedModules.size;
    const exportsRemoved = result.removedExports.size;

    const moduleReduction = totalModules > 0 ? (modulesRemoved / totalModules) * 100 : 0;
    const exportReduction = totalExports > 0 ? (exportsRemoved / totalExports) * 100 : 0;

    return `
Tree Shaking Results:
  Modules: ${result.usedModules.size} used, ${modulesRemoved} removed (${moduleReduction.toFixed(1)}% reduction)
  Exports: ${result.usedExports.size} used, ${exportsRemoved} removed (${exportReduction.toFixed(1)}% reduction)
  Side Effects: ${result.sideEffectModules.size} modules with side effects
  Bytes Removed: ${(result.bytesRemoved / 1024).toFixed(2)} KB
    `.trim();
  }

  /**
   * Clear internal state
   */
  clear(): void {
    this.usedExports.clear();
    this.sideEffectModules.clear();
    this.pureAnnotations.clear();
  }
}
