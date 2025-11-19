/**
 * Vite Clone - Plugin Types
 *
 * TypeScript type definitions for Vite plugins (Rollup-compatible).
 */

import type { ResolvedConfig, UserConfig, ConfigEnv } from './config';
import type { ModuleNode } from '../server/moduleGraph';

/**
 * Plugin option (can be array or promise)
 */
export type PluginOption = Plugin | false | null | undefined | PluginOption[] | Promise<Plugin | PluginOption[]>;

/**
 * Plugin interface
 */
export interface Plugin {
  /**
   * Plugin name
   */
  name: string;

  /**
   * Plugin enforcement (pre or post)
   */
  enforce?: 'pre' | 'post';

  /**
   * Apply plugin conditionally
   */
  apply?: 'serve' | 'build' | ((config: UserConfig, env: ConfigEnv) => boolean);

  /**
   * Modify Vite config before it's resolved
   */
  config?: (
    config: UserConfig,
    env: ConfigEnv,
  ) => UserConfig | null | void | Promise<UserConfig | null | void>;

  /**
   * Use this hook to read and store the final resolved config
   */
  configResolved?: (config: ResolvedConfig) => void | Promise<void>;

  /**
   * Configure the dev server
   */
  configureServer?: (server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>;

  /**
   * Configure the preview server
   */
  configurePreviewServer?: (server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>;

  /**
   * Transform index.html
   */
  transformIndexHtml?: IndexHtmlTransformHook;

  /**
   * Custom HMR update handling
   */
  handleHotUpdate?: (ctx: HmrContext) => Array<ModuleNode> | void | Promise<Array<ModuleNode> | void>;

  /**
   * Rollup plugin hooks
   */
  options?: (options: any) => any | null | Promise<any | null>;
  buildStart?: (this: PluginContext, options: any) => void | Promise<void>;
  resolveId?: (
    this: PluginContext,
    source: string,
    importer: string | undefined,
    options: any,
  ) => string | ResolveIdResult | null | Promise<string | ResolveIdResult | null>;
  load?: (this: PluginContext, id: string, options?: any) => string | LoadResult | null | Promise<string | LoadResult | null>;
  transform?: (
    this: PluginContext,
    code: string,
    id: string,
    options?: any,
  ) => string | TransformResult | null | Promise<string | TransformResult | null>;
  buildEnd?: (this: PluginContext, error?: Error) => void | Promise<void>;
  closeBundle?: () => void | Promise<void>;

  /**
   * Additional Rollup hooks
   */
  moduleParsed?: (this: PluginContext, info: any) => void | Promise<void>;
  renderChunk?: (
    this: PluginContext,
    code: string,
    chunk: any,
    options: any,
  ) => string | RenderChunkResult | null | Promise<string | RenderChunkResult | null>;
  generateBundle?: (this: PluginContext, options: any, bundle: any) => void | Promise<void>;
  writeBundle?: (this: PluginContext, options: any, bundle: any) => void | Promise<void>;
}

/**
 * Plugin context (Rollup-compatible)
 */
export interface PluginContext {
  meta: {
    rollupVersion: string;
    watchMode: boolean;
  };

  parse: (code: string, options?: any) => any;
  resolve: (
    id: string,
    importer?: string,
    options?: any,
  ) => Promise<ResolveIdResult | null>;
  getModuleInfo: (id: string) => ModuleInfo | null;
  getModuleIds: () => IterableIterator<string>;
  getWatchFiles: () => string[];
  emitFile: (file: EmittedFile) => string;
  setAssetSource: (assetId: string, source: string | Uint8Array) => void;
  getFileName: (referenceId: string) => string;
  warn: (warning: string | RollupError, position?: number | { column: number; line: number }) => void;
  error: (error: string | RollupError, position?: number | { column: number; line: number }) => never;
}

/**
 * Resolve ID result
 */
export interface ResolveIdResult {
  id: string;
  external?: boolean;
  moduleSideEffects?: boolean;
  meta?: any;
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
 * Transform result
 */
export interface TransformResult {
  code: string;
  map?: any;
  meta?: any;
}

/**
 * Render chunk result
 */
export interface RenderChunkResult {
  code: string;
  map?: any;
}

/**
 * Module info
 */
export interface ModuleInfo {
  id: string;
  importers: string[];
  dynamicImporters: string[];
  importedIds: string[];
  dynamicallyImportedIds: string[];
  isEntry: boolean;
  code: string | null;
  meta?: any;
}

/**
 * Emitted file
 */
export interface EmittedFile {
  type: 'asset' | 'chunk';
  id?: string;
  name?: string;
  fileName?: string;
  source?: string | Uint8Array;
  preserveSignature?: 'strict' | 'allow-extension' | 'exports-only' | false;
}

/**
 * Rollup error
 */
export interface RollupError extends Error {
  id?: string;
  plugin?: string;
  pluginCode?: string;
  frame?: string;
  loc?: ErrorLocation;
}

/**
 * Error location
 */
export interface ErrorLocation {
  file?: string;
  line: number;
  column: number;
}

/**
 * Vite dev server interface
 */
export interface ViteDevServer {
  config: ResolvedConfig;
  middlewares: any;
  httpServer: any;
  ws: any;
  moduleGraph: any;
  transformRequest: (url: string, options?: any) => Promise<any>;
  transformIndexHtml: (url: string, html: string) => Promise<string>;
  listen: (port?: number, host?: string) => Promise<void>;
  close: () => Promise<void>;
  restart: () => Promise<void>;
}

/**
 * Index HTML transform hook
 */
export type IndexHtmlTransformHook =
  | IndexHtmlTransform
  | {
      enforce?: 'pre' | 'post';
      transform: IndexHtmlTransform;
    };

/**
 * Index HTML transform function
 */
export type IndexHtmlTransform = (
  html: string,
  ctx: IndexHtmlTransformContext,
) => string | IndexHtmlTransformResult | void | Promise<string | IndexHtmlTransformResult | void>;

/**
 * Index HTML transform context
 */
export interface IndexHtmlTransformContext {
  path: string;
  filename: string;
  server?: ViteDevServer;
  bundle?: any;
  chunk?: any;
}

/**
 * Index HTML transform result
 */
export interface IndexHtmlTransformResult {
  html: string;
  tags?: HtmlTagDescriptor[];
}

/**
 * HTML tag descriptor
 */
export interface HtmlTagDescriptor {
  tag: string;
  attrs?: Record<string, string | boolean | undefined>;
  children?: string | HtmlTagDescriptor[];
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend';
}

/**
 * HMR context
 */
export interface HmrContext {
  file: string;
  timestamp: number;
  modules: Array<ModuleNode>;
  read: () => string | Promise<string>;
  server: ViteDevServer;
}
