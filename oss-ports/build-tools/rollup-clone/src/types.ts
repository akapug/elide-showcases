/**
 * Rollup Clone - Type Definitions
 */

export interface InputOptions {
  input: string | string[] | Record<string, string>;
  external?: (string | RegExp)[] | ((id: string, parentId?: string, isResolved?: boolean) => boolean);
  plugins?: Plugin[];
  root?: string;
  treeshake?: TreeshakeOptions | false;
  cache?: RollupCache;
  onwarn?: (warning: any) => void;
  perf?: boolean;
  strictDeprecations?: boolean;
  acorn?: any;
  acornInjectPlugins?: any[];
  context?: string;
  moduleContext?: Record<string, string> | ((id: string) => string);
  preserveEntrySignatures?: 'strict' | 'allow-extension' | 'exports-only' | false;
  shimMissingExports?: boolean;
  maxParallelFileReads?: number;
  output?: OutputOptions | OutputOptions[];
}

export interface OutputOptions {
  format?: 'esm' | 'cjs' | 'umd' | 'iife' | 'system';
  dir?: string;
  file?: string;
  name?: string;
  globals?: Record<string, string> | ((id: string) => string);
  entryFileNames?: string;
  chunkFileNames?: string;
  assetFileNames?: string;
  sourcemap?: boolean | 'inline' | 'hidden';
  sourcemapExcludeSources?: boolean;
  sourcemapFile?: string;
  sourcemapPathTransform?: (path: string) => string;
  banner?: string | (() => string | Promise<string>);
  footer?: string | (() => string | Promise<string>);
  intro?: string | (() => string | Promise<string>);
  outro?: string | (() => string | Promise<string>);
  compact?: boolean;
  minifyInternalExports?: boolean;
  generatedCode?: {
    arrowFunctions?: boolean;
    constBindings?: boolean;
    objectShorthand?: boolean;
    reservedNamesAsProps?: boolean;
    symbols?: boolean;
  };
  interop?: 'auto' | 'esModule' | 'default' | 'defaultOnly' | boolean;
  esModule?: boolean;
  exports?: 'auto' | 'default' | 'named' | 'none';
  freeze?: boolean;
  indent?: boolean | string;
  namespaceToStringTag?: boolean;
  preferConst?: boolean;
  strict?: boolean;
  systemNullSetters?: boolean;
  manualChunks?: Record<string, string[]> | ((id: string) => string | void);
  preserveModules?: boolean;
  preserveModulesRoot?: string;
  validate?: boolean;
  externalLiveBindings?: boolean;
  inlineDynamicImports?: boolean;
}

export interface TreeshakeOptions {
  moduleSideEffects?: boolean | 'no-treeshake' | ((id: string, external: boolean) => boolean);
  propertyReadSideEffects?: boolean;
  tryCatchDeoptimization?: boolean;
  unknownGlobalSideEffects?: boolean;
}

export interface Plugin {
  name: string;
  options?: (this: PluginContext, options: InputOptions) => InputOptions | null | void;
  buildStart?: (this: PluginContext, options: InputOptions) => void | Promise<void>;
  resolveId?: (
    this: PluginContext,
    source: string,
    importer: string | undefined,
    options: any
  ) => string | ResolveIdResult | null | Promise<string | ResolveIdResult | null>;
  load?: (
    this: PluginContext,
    id: string
  ) => string | LoadResult | null | Promise<string | LoadResult | null>;
  transform?: (
    this: PluginContext,
    code: string,
    id: string
  ) => string | TransformResult | null | Promise<string | TransformResult | null>;
  renderChunk?: (
    this: PluginContext,
    code: string,
    chunk: any,
    options: OutputOptions
  ) => string | RenderChunkResult | null | Promise<string | RenderChunkResult | null>;
  generateBundle?: (this: PluginContext, options: OutputOptions, bundle: any) => void | Promise<void>;
  buildEnd?: (this: PluginContext, error?: Error) => void | Promise<void>;
  closeBundle?: () => void | Promise<void>;
  renderStart?: (this: PluginContext, options: OutputOptions, bundle: any) => void | Promise<void>;
  renderEnd?: (this: PluginContext, options: OutputOptions, bundle: any) => void | Promise<void>;
}

export interface PluginContext {
  meta: { rollupVersion: string; watchMode: boolean };
  parse: (code: string, options?: any) => any;
  resolve: (id: string, importer?: string, options?: any) => Promise<ResolveIdResult | null>;
  getModuleInfo: (id: string) => ModuleInfo | null;
  getModuleIds: () => IterableIterator<string>;
  getWatchFiles: () => string[];
  emitFile: (file: any) => string;
  setAssetSource: (assetId: string, source: string | Uint8Array) => void;
  getFileName: (referenceId: string) => string;
  warn: (warning: string | any, position?: any) => void;
  error: (error: string | any, position?: any) => never;
}

export interface ResolveIdResult {
  id: string;
  external?: boolean;
  moduleSideEffects?: boolean;
  meta?: any;
}

export interface LoadResult {
  code: string;
  map?: any;
  meta?: any;
}

export interface TransformResult {
  code: string;
  map?: any;
  meta?: any;
}

export interface RenderChunkResult {
  code: string;
  map?: any;
}

export interface ModuleInfo {
  id: string;
  isEntry: boolean;
  code: string | null;
  meta: any;
}

export interface RollupBuild {
  cache: RollupCache;
  generate: (options: OutputOptions) => Promise<RollupOutput>;
  write: (options: OutputOptions) => Promise<RollupOutput>;
  close: () => Promise<void>;
  closed: boolean;
  watchFiles: string[];
}

export interface RollupOutput {
  output: (OutputChunk | OutputAsset)[];
}

export interface OutputChunk {
  type: 'chunk';
  code: string;
  map?: any;
  fileName: string;
  name: string;
  facadeModuleId?: string;
  isDynamicEntry: boolean;
  isEntry: boolean;
  isImplicitEntry: boolean;
  imports: string[];
  dynamicImports: string[];
  modules: Record<string, any>;
  exports: string[];
  moduleIds: string[];
}

export interface OutputAsset {
  type: 'asset';
  fileName: string;
  source: string | Uint8Array;
  name?: string;
}

export interface RollupCache {
  modules: any[];
}
