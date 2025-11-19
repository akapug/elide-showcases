/**
 * Elide Build Plugin System
 *
 * Extensible plugin architecture for custom build logic:
 * - Plugin API
 * - Common built-in plugins
 * - Plugin lifecycle hooks
 * - Plugin composition
 */

export interface Plugin {
  name: string;
  setup(build: PluginBuild): void | Promise<void>;
}

export interface PluginBuild {
  onStart(callback: () => void | Promise<void>): void;
  onEnd(callback: (result: any) => void | Promise<void>): void;
  onResolve(options: OnResolveOptions, callback: OnResolveCallback): void;
  onLoad(options: OnLoadOptions, callback: OnLoadCallback): void;
  onTransform(options: OnTransformOptions, callback: OnTransformCallback): void;
}

export interface OnResolveOptions {
  filter: RegExp;
  namespace?: string;
}

export interface OnResolveCallback {
  (args: OnResolveArgs): OnResolveResult | null | Promise<OnResolveResult | null>;
}

export interface OnResolveArgs {
  path: string;
  importer: string;
  namespace: string;
  resolveDir: string;
}

export interface OnResolveResult {
  path?: string;
  external?: boolean;
  namespace?: string;
  sideEffects?: boolean;
}

export interface OnLoadOptions {
  filter: RegExp;
  namespace?: string;
}

export interface OnLoadCallback {
  (args: OnLoadArgs): OnLoadResult | null | Promise<OnLoadResult | null>;
}

export interface OnLoadArgs {
  path: string;
  namespace: string;
}

export interface OnLoadResult {
  contents: string | Buffer;
  loader?: string;
}

export interface OnTransformOptions {
  filter: RegExp;
}

export interface OnTransformCallback {
  (args: OnTransformArgs): OnTransformResult | null | Promise<OnTransformResult | null>;
}

export interface OnTransformArgs {
  code: string;
  path: string;
}

export interface OnTransformResult {
  code: string;
  map?: any;
}

/**
 * Plugin manager
 */
export class PluginManager {
  private plugins: Plugin[] = [];
  private startCallbacks: Array<() => void | Promise<void>> = [];
  private endCallbacks: Array<(result: any) => void | Promise<void>> = [];
  private resolveCallbacks: Map<RegExp, OnResolveCallback> = new Map();
  private loadCallbacks: Map<RegExp, OnLoadCallback> = new Map();
  private transformCallbacks: Map<RegExp, OnTransformCallback> = new Map();

  /**
   * Register a plugin
   */
  async use(plugin: Plugin): Promise<void> {
    this.plugins.push(plugin);

    const build: PluginBuild = {
      onStart: (callback) => this.startCallbacks.push(callback),
      onEnd: (callback) => this.endCallbacks.push(callback),
      onResolve: (options, callback) => this.resolveCallbacks.set(options.filter, callback),
      onLoad: (options, callback) => this.loadCallbacks.set(options.filter, callback),
      onTransform: (options, callback) => this.transformCallbacks.set(options.filter, callback),
    };

    await plugin.setup(build);
  }

  /**
   * Call start hooks
   */
  async callStart(): Promise<void> {
    for (const callback of this.startCallbacks) {
      await callback();
    }
  }

  /**
   * Call end hooks
   */
  async callEnd(result: any): Promise<void> {
    for (const callback of this.endCallbacks) {
      await callback(result);
    }
  }

  /**
   * Call resolve hooks
   */
  async callResolve(args: OnResolveArgs): Promise<OnResolveResult | null> {
    for (const [filter, callback] of this.resolveCallbacks) {
      if (filter.test(args.path)) {
        const result = await callback(args);
        if (result) return result;
      }
    }
    return null;
  }

  /**
   * Call load hooks
   */
  async callLoad(args: OnLoadArgs): Promise<OnLoadResult | null> {
    for (const [filter, callback] of this.loadCallbacks) {
      if (filter.test(args.path)) {
        const result = await callback(args);
        if (result) return result;
      }
    }
    return null;
  }

  /**
   * Call transform hooks
   */
  async callTransform(args: OnTransformArgs): Promise<OnTransformResult | null> {
    let code = args.code;
    let map: any = null;

    for (const [filter, callback] of this.transformCallbacks) {
      if (filter.test(args.path)) {
        const result = await callback({ ...args, code });
        if (result) {
          code = result.code;
          if (result.map) map = result.map;
        }
      }
    }

    return code !== args.code ? { code, map } : null;
  }
}

// Export built-in plugins
export * from "./html-plugin";
export * from "./css-plugin";
export * from "./image-plugin";
export * from "./compression-plugin";
export * from "./copy-plugin";
export * from "./env-plugin";
