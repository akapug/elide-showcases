/**
 * Auto-Import System for Nuxt Clone
 *
 * Auto-imports:
 * - Components from components/
 * - Composables from composables/
 * - Utils from utils/
 * - Vue APIs (ref, computed, etc.)
 * - Nuxt APIs (useRouter, useFetch, etc.)
 */

import { readdir } from 'fs/promises';
import { join, relative, parse } from 'path';
import { pathToFileURL } from 'url';

export interface AutoImport {
  name: string;
  from: string;
  type: 'component' | 'composable' | 'util' | 'vue' | 'nuxt';
}

export class AutoImportSystem {
  private imports: AutoImport[] = [];
  private componentsDir: string;
  private composablesDir: string;
  private utilsDir: string;

  constructor(rootDir: string) {
    this.componentsDir = join(rootDir, 'components');
    this.composablesDir = join(rootDir, 'composables');
    this.utilsDir = join(rootDir, 'utils');
  }

  /**
   * Scan and register auto-imports
   */
  async scan(): Promise<void> {
    console.log('[AutoImport] Scanning for auto-imports...');
    const start = performance.now();

    // Scan components
    await this.scanComponents();

    // Scan composables
    await this.scanComposables();

    // Scan utils
    await this.scanUtils();

    // Add Vue APIs
    this.addVueAPIs();

    // Add Nuxt APIs
    this.addNuxtAPIs();

    const elapsed = performance.now() - start;
    console.log(`[AutoImport] Found ${this.imports.length} auto-imports in ${elapsed.toFixed(2)}ms`);
  }

  /**
   * Scan components directory
   */
  private async scanComponents(): Promise<void> {
    try {
      await this.scanDirectory(this.componentsDir, 'component');
    } catch {
      // Directory doesn't exist
    }
  }

  /**
   * Scan composables directory
   */
  private async scanComposables(): Promise<void> {
    try {
      await this.scanDirectory(this.composablesDir, 'composable');
    } catch {
      // Directory doesn't exist
    }
  }

  /**
   * Scan utils directory
   */
  private async scanUtils(): Promise<void> {
    try {
      await this.scanDirectory(this.utilsDir, 'util');
    } catch {
      // Directory doesn't exist
    }
  }

  /**
   * Scan directory for exports
   */
  private async scanDirectory(
    dir: string,
    type: AutoImport['type'],
    basePath = ''
  ): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, type, relativePath);
      } else if (entry.isFile() && this.isImportableFile(entry.name)) {
        const parsed = parse(relativePath);
        const name = this.generateImportName(parsed.dir, parsed.name, type);

        this.imports.push({
          name,
          from: fullPath,
          type,
        });
      }
    }
  }

  /**
   * Generate import name
   */
  private generateImportName(
    dir: string,
    filename: string,
    type: AutoImport['type']
  ): string {
    // For components, use PascalCase
    if (type === 'component') {
      const parts = [...dir.split('/'), filename].filter(Boolean);
      return parts.map(p => this.toPascalCase(p)).join('');
    }

    // For composables, ensure it starts with 'use'
    if (type === 'composable') {
      const name = this.toCamelCase(filename);
      return name.startsWith('use') ? name : 'use' + this.toPascalCase(filename);
    }

    // For utils, use camelCase
    return this.toCamelCase(filename);
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
      .replace(/^[a-z]/, c => c.toUpperCase());
  }

  /**
   * Convert to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }

  /**
   * Check if file can be imported
   */
  private isImportableFile(filename: string): boolean {
    return /\.(vue|tsx?|jsx?)$/.test(filename) &&
           !filename.startsWith('_') &&
           !filename.endsWith('.test.ts') &&
           !filename.endsWith('.spec.ts');
  }

  /**
   * Add Vue APIs
   */
  private addVueAPIs(): void {
    const vueAPIs = [
      'ref',
      'computed',
      'reactive',
      'readonly',
      'watch',
      'watchEffect',
      'onMounted',
      'onUnmounted',
      'onBeforeMount',
      'onBeforeUnmount',
      'onUpdated',
      'onBeforeUpdate',
      'onActivated',
      'onDeactivated',
      'onErrorCaptured',
      'provide',
      'inject',
      'nextTick',
      'defineComponent',
      'defineAsyncComponent',
      'h',
      'createVNode',
      'toRef',
      'toRefs',
      'isRef',
      'unref',
      'shallowRef',
      'triggerRef',
      'customRef',
      'isReactive',
      'isReadonly',
      'isProxy',
      'toRaw',
      'markRaw',
      'effectScope',
      'getCurrentScope',
      'onScopeDispose',
    ];

    for (const name of vueAPIs) {
      this.imports.push({
        name,
        from: 'vue',
        type: 'vue',
      });
    }
  }

  /**
   * Add Nuxt APIs
   */
  private addNuxtAPIs(): void {
    const nuxtAPIs = [
      'useRouter',
      'useRoute',
      'navigateTo',
      'useFetch',
      'useLazyFetch',
      'useAsyncData',
      'useLazyAsyncData',
      'useState',
      'useCookie',
      'useRequestHeaders',
      'useRequestEvent',
      'useRuntimeConfig',
      'useAppConfig',
      'useNuxtApp',
      'useHead',
      'useSeoMeta',
      'definePageMeta',
      'defineNuxtComponent',
      'defineNuxtPlugin',
      'defineNuxtRouteMiddleware',
      'defineEventHandler',
      'navigateTo',
      'abortNavigation',
      'setPageLayout',
      'showError',
      'clearError',
      'createError',
      'useError',
      'callOnce',
      'refreshNuxtData',
      'clearNuxtData',
      'reloadNuxtApp',
      'prerenderRoutes',
    ];

    for (const name of nuxtAPIs) {
      this.imports.push({
        name,
        from: '#app',
        type: 'nuxt',
      });
    }
  }

  /**
   * Get all imports
   */
  getImports(): AutoImport[] {
    return [...this.imports];
  }

  /**
   * Get imports by type
   */
  getImportsByType(type: AutoImport['type']): AutoImport[] {
    return this.imports.filter(i => i.type === type);
  }

  /**
   * Generate TypeScript declarations
   */
  generateDeclarations(): string {
    const lines: string[] = [
      '// Auto-generated by Elide Nuxt',
      '// Do not edit this file manually',
      '',
      'declare global {',
    ];

    // Group by type
    const byType = new Map<string, AutoImport[]>();
    for (const imp of this.imports) {
      const existing = byType.get(imp.type) || [];
      existing.push(imp);
      byType.set(imp.type, existing);
    }

    // Generate declarations
    for (const [type, imports] of byType) {
      lines.push(`  // ${type}s`);
      for (const imp of imports) {
        if (type === 'component') {
          lines.push(`  const ${imp.name}: typeof import('${imp.from}').default;`);
        } else {
          lines.push(`  const ${imp.name}: typeof import('${imp.from}').${imp.name};`);
        }
      }
      lines.push('');
    }

    lines.push('}');
    lines.push('');
    lines.push('export {};');

    return lines.join('\n');
  }

  /**
   * Generate import map for bundler
   */
  generateImportMap(): Record<string, string> {
    const map: Record<string, string> = {};

    for (const imp of this.imports) {
      map[imp.name] = imp.from;
    }

    return map;
  }

  /**
   * Transform code to add imports
   */
  transformCode(code: string): string {
    // Simple implementation - in production, use proper AST transformation
    const usedImports = new Set<string>();

    // Find used imports
    for (const imp of this.imports) {
      const regex = new RegExp(`\\b${imp.name}\\b`);
      if (regex.test(code)) {
        usedImports.add(imp.name);
      }
    }

    // Generate import statements
    const imports: string[] = [];
    const bySource = new Map<string, string[]>();

    for (const name of usedImports) {
      const imp = this.imports.find(i => i.name === name);
      if (imp) {
        const existing = bySource.get(imp.from) || [];
        existing.push(imp.type === 'component' ? 'default as ' + name : name);
        bySource.set(imp.from, existing);
      }
    }

    for (const [source, names] of bySource) {
      imports.push(`import { ${names.join(', ')} } from '${source}';`);
    }

    // Prepend imports to code
    if (imports.length > 0) {
      return imports.join('\n') + '\n\n' + code;
    }

    return code;
  }
}

export default AutoImportSystem;
