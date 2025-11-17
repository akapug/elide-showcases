/**
 * Rollup Clone - Plugin Driver
 *
 * Manages plugin execution and hooks.
 */

import type { Plugin, PluginContext } from '../types';

export class PluginDriver {
  private plugins: Plugin[];
  private context: Map<Plugin, PluginContext> = new Map();
  private emittedFiles: Array<any> = [];

  constructor(plugins: Plugin[]) {
    this.plugins = plugins;
  }

  async hookParallel(hookName: string, ...args: any[]): Promise<any> {
    const promises = this.plugins.filter(p => p[hookName]).map(plugin => {
      const context = this.getContext(plugin);
      return plugin[hookName]!.call(context, ...args);
    });

    await Promise.all(promises);
  }

  async hookSeq(hookName: string, ...args: any[]): Promise<any> {
    let result: any;

    for (const plugin of this.plugins) {
      if (plugin[hookName]) {
        const context = this.getContext(plugin);
        const hookResult = await plugin[hookName]!.call(context, ...args);

        if (hookResult !== null && hookResult !== undefined) {
          if (hookName === 'transform') {
            // Chain transformations
            args[0] = typeof hookResult === 'string' ? hookResult : hookResult.code;
            result = hookResult;
          } else {
            result = hookResult;
          }
        }
      }
    }

    return result;
  }

  async hookFirst(hookName: string, ...args: any[]): Promise<any> {
    for (const plugin of this.plugins) {
      if (plugin[hookName]) {
        const context = this.getContext(plugin);
        const result = await plugin[hookName]!.call(context, ...args);
        if (result !== null && result !== undefined) {
          return result;
        }
      }
    }
    return null;
  }

  private getContext(plugin: Plugin): PluginContext {
    if (this.context.has(plugin)) {
      return this.context.get(plugin)!;
    }

    const context: PluginContext = {
      meta: { rollupVersion: '3.0.0', watchMode: false },
      parse: (code: string) => ({}),
      resolve: async (id: string, importer?: string) => null,
      getModuleInfo: (id: string) => null,
      getModuleIds: () => [][Symbol.iterator](),
      getWatchFiles: () => [],
      emitFile: (file: any) => {
        this.emittedFiles.push(file);
        return file.fileName || 'file';
      },
      setAssetSource: (id: string, source: any) => {},
      getFileName: (id: string) => id,
      warn: (warning: any) => console.warn(warning),
      error: (error: any) => { throw new Error(error); },
    };

    this.context.set(plugin, context);
    return context;
  }

  getEmittedFiles(): Array<any> {
    return this.emittedFiles;
  }
}
