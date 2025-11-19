/**
 * Vite Clone - Plugin Container
 *
 * Executes plugin hooks in the correct order with proper context.
 * Compatible with Rollup plugin API with Vite-specific extensions.
 */

import type { Plugin, PluginContext } from '../types/plugin';
import type { ResolvedConfig } from '../types/config';

/**
 * Plugin container interface
 */
export interface PluginContainer {
  options: any;
  buildStart: () => Promise<void>;
  resolveId: (id: string, importer?: string, options?: ResolveIdOptions) => Promise<PartialResolvedId | null>;
  load: (id: string, options?: LoadOptions) => Promise<LoadResult | null>;
  transform: (code: string, id: string, options?: TransformOptions) => Promise<TransformResult | null>;
  close: () => Promise<void>;
}

/**
 * Resolve ID options
 */
export interface ResolveIdOptions {
  custom?: any;
  isEntry?: boolean;
  ssr?: boolean;
  skip?: Plugin[];
}

/**
 * Partial resolved ID
 */
export interface PartialResolvedId {
  id: string;
  external?: boolean;
  moduleSideEffects?: boolean;
  meta?: any;
}

/**
 * Load options
 */
export interface LoadOptions {
  ssr?: boolean;
}

/**
 * Load result
 */
export interface LoadResult {
  code: string;
  map?: any;
  meta?: any;
}

/**
 * Transform options
 */
export interface TransformOptions {
  ssr?: boolean;
  inMap?: any;
}

/**
 * Transform result
 */
export interface TransformResult {
  code: string;
  map?: any;
  meta?: any;
}

/**
 * Create plugin container
 */
export function createPluginContainer(plugins: Plugin[]): PluginContainer {
  // Separate plugins by hook phase
  const prePlugins = plugins.filter((p) => p.enforce === 'pre');
  const normalPlugins = plugins.filter((p) => !p.enforce || p.enforce === 'normal');
  const postPlugins = plugins.filter((p) => p.enforce === 'post');

  const sortedPlugins = [...prePlugins, ...normalPlugins, ...postPlugins];

  // Store context for each plugin
  const pluginContexts = new Map<Plugin, PluginContext>();

  /**
   * Create plugin context
   */
  function createContext(plugin: Plugin): PluginContext {
    const existingContext = pluginContexts.get(plugin);
    if (existingContext) {
      return existingContext;
    }

    const context: PluginContext = {
      meta: {
        rollupVersion: '3.0.0',
        watchMode: false,
      },

      parse: (code: string) => {
        // Would use a parser like acorn
        return null as any;
      },

      resolve: async (id: string, importer?: string, options?: any) => {
        return await container.resolveId(id, importer, {
          ...options,
          skip: [...(options?.skip || []), plugin],
        });
      },

      getModuleInfo: (id: string) => {
        // Would get module info from module graph
        return null;
      },

      getModuleIds: () => {
        // Would return all module IDs
        return [][Symbol.iterator]();
      },

      getWatchFiles: () => {
        return [];
      },

      emitFile: (emittedFile: any) => {
        // Would emit file to output
        return '';
      },

      setAssetSource: (assetId: string, source: string | Uint8Array) => {
        // Would set asset source
      },

      getFileName: (referenceId: string) => {
        // Would get file name for reference
        return '';
      },

      warn: (warning: any) => {
        console.warn(`[${plugin.name}]`, warning);
      },

      error: (error: any) => {
        throw new Error(`[${plugin.name}] ${error}`);
      },
    };

    pluginContexts.set(plugin, context);
    return context;
  }

  const container: PluginContainer = {
    options: {},

    async buildStart() {
      for (const plugin of sortedPlugins) {
        if (plugin.buildStart) {
          const context = createContext(plugin);
          await plugin.buildStart.call(context, container.options);
        }
      }
    },

    async resolveId(id: string, importer?: string, options?: ResolveIdOptions) {
      const skip = options?.skip || [];

      for (const plugin of sortedPlugins) {
        if (skip.includes(plugin)) continue;
        if (!plugin.resolveId) continue;

        const context = createContext(plugin);
        const result = await plugin.resolveId.call(
          context,
          id,
          importer,
          { ...options, custom: options?.custom },
        );

        if (result) {
          if (typeof result === 'string') {
            return {
              id: result,
              external: false,
            };
          }
          return result;
        }
      }

      return null;
    },

    async load(id: string, options?: LoadOptions) {
      for (const plugin of sortedPlugins) {
        if (!plugin.load) continue;

        const context = createContext(plugin);
        const result = await plugin.load.call(context, id, { ssr: options?.ssr });

        if (result) {
          if (typeof result === 'string') {
            return {
              code: result,
              map: null,
            };
          }
          return result;
        }
      }

      return null;
    },

    async transform(code: string, id: string, options?: TransformOptions) {
      let transformedCode = code;
      let combinedMap: any = options?.inMap;

      for (const plugin of sortedPlugins) {
        if (!plugin.transform) continue;

        const context = createContext(plugin);
        const result = await plugin.transform.call(
          context,
          transformedCode,
          id,
          { ssr: options?.ssr },
        );

        if (!result) continue;

        if (typeof result === 'string') {
          transformedCode = result;
        } else {
          transformedCode = result.code;
          if (result.map) {
            combinedMap = combineSourceMaps(combinedMap, result.map);
          }
        }
      }

      if (transformedCode === code) {
        return null;
      }

      return {
        code: transformedCode,
        map: combinedMap,
      };
    },

    async close() {
      for (const plugin of sortedPlugins) {
        if (plugin.buildEnd) {
          const context = createContext(plugin);
          await plugin.buildEnd.call(context);
        }
      }

      for (const plugin of sortedPlugins) {
        if (plugin.closeBundle) {
          await plugin.closeBundle();
        }
      }
    },
  };

  return container;
}

/**
 * Combine source maps
 */
function combineSourceMaps(map1: any, map2: any): any {
  if (!map1) return map2;
  if (!map2) return map1;

  // Simplified source map combination
  // In production, would use a library like @ampproject/remapping
  return map2;
}
