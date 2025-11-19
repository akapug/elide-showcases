/**
 * Vite Clone - Configuration Types
 *
 * TypeScript type definitions for Vite configuration.
 */

import type { Plugin, PluginOption } from './plugin';

/**
 * User configuration
 */
export interface UserConfig {
  /**
   * Project root directory
   */
  root?: string;

  /**
   * Base public path
   */
  base?: string;

  /**
   * Build mode
   */
  mode?: string;

  /**
   * Define global constants
   */
  define?: Record<string, any>;

  /**
   * Array of plugins
   */
  plugins?: PluginOption[];

  /**
   * Public directory
   */
  publicDir?: string | false;

  /**
   * Cache directory
   */
  cacheDir?: string;

  /**
   * Path resolution options
   */
  resolve?: ResolveOptions;

  /**
   * CSS options
   */
  css?: CSSOptions;

  /**
   * JSON options
   */
  json?: JsonOptions;

  /**
   * ESBuild transform options
   */
  esbuild?: ESBuildOptions | false;

  /**
   * Static asset handling
   */
  assetsInclude?: string | RegExp | (string | RegExp)[];

  /**
   * Logger level
   */
  logLevel?: 'info' | 'warn' | 'error' | 'silent';

  /**
   * Custom logger
   */
  customLogger?: Logger;

  /**
   * Clear screen when logging
   */
  clearScreen?: boolean;

  /**
   * Environment file directory
   */
  envDir?: string;

  /**
   * Environment variable prefix
   */
  envPrefix?: string | string[];

  /**
   * Server options
   */
  server?: ServerOptions;

  /**
   * Build options
   */
  build?: BuildOptions;

  /**
   * Preview server options
   */
  preview?: PreviewOptions;

  /**
   * Dependency optimization options
   */
  optimizeDeps?: DepOptimizationOptions;

  /**
   * SSR options
   */
  ssr?: SSROptions;

  /**
   * Worker options
   */
  worker?: WorkerOptions;

  /**
   * App type
   */
  appType?: 'spa' | 'mpa' | 'custom';
}

/**
 * Resolved configuration
 */
export interface ResolvedConfig extends Required<Omit<UserConfig, 'plugins'>> {
  /**
   * Config file path
   */
  configFile: string | undefined;

  /**
   * Config file dependencies
   */
  configFileDependencies: string[];

  /**
   * Inline config
   */
  inlineConfig: InlineConfig;

  /**
   * Resolved plugins
   */
  plugins: readonly Plugin[];

  /**
   * Environment variables
   */
  env: Record<string, string>;

  /**
   * Is production build
   */
  isProduction: boolean;

  /**
   * Build command
   */
  command: 'build' | 'serve';

  /**
   * Logger
   */
  logger: Logger;

  /**
   * Create resolver
   */
  createResolver: (options?: Partial<ResolveOptions>) => ResolverFunction;

  /**
   * Asset include test
   */
  assetsInclude: (file: string) => boolean;
}

/**
 * Inline configuration
 */
export type InlineConfig = UserConfig & {
  configFile?: string | false;
};

/**
 * Configuration environment
 */
export interface ConfigEnv {
  command: 'build' | 'serve';
  mode: string;
}

/**
 * Resolve options
 */
export interface ResolveOptions {
  /**
   * Path aliases
   */
  alias?: Record<string, string> | AliasOptions[];

  /**
   * Dedupe packages
   */
  dedupe?: string[];

  /**
   * Custom conditions
   */
  conditions?: string[];

  /**
   * Main fields to resolve
   */
  mainFields?: string[];

  /**
   * Extensions to try
   */
  extensions?: string[];

  /**
   * Preserve symlinks
   */
  preserveSymlinks?: boolean;
}

/**
 * Alias options
 */
export interface AliasOptions {
  find: string | RegExp;
  replacement: string;
  customResolver?: ResolverFunction;
}

/**
 * Resolver function
 */
export interface ResolverFunction {
  (id: string, importer?: string): Promise<string | null>;
}

/**
 * CSS options
 */
export interface CSSOptions {
  /**
   * CSS modules options
   */
  modules?: CSSModulesOptions;

  /**
   * PostCSS config
   */
  postcss?: string | any;

  /**
   * Preprocessor options
   */
  preprocessorOptions?: Record<string, any>;

  /**
   * Enable CSS source maps in dev
   */
  devSourcemap?: boolean;
}

/**
 * CSS modules options
 */
export interface CSSModulesOptions {
  localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly';
  scopeBehaviour?: 'global' | 'local';
  generateScopedName?: string | ((name: string, filename: string, css: string) => string);
  hashPrefix?: string;
  globalModulePaths?: RegExp[];
}

/**
 * JSON options
 */
export interface JsonOptions {
  /**
   * Generate named exports
   */
  namedExports?: boolean;

  /**
   * Stringify for large files
   */
  stringify?: boolean;
}

/**
 * ESBuild options
 */
export interface ESBuildOptions {
  jsx?: 'transform' | 'preserve' | 'automatic';
  jsxDev?: boolean;
  jsxFactory?: string;
  jsxFragment?: string;
  jsxImportSource?: string;
  jsxSideEffects?: boolean;
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  target?: string | string[];
  tsconfigRaw?: string | any;
}

/**
 * Server options
 */
export interface ServerOptions {
  /**
   * Server hostname
   */
  host?: string | boolean;

  /**
   * Server port
   */
  port?: number;

  /**
   * Strict port (fail if port is in use)
   */
  strictPort?: boolean;

  /**
   * HTTPS config
   */
  https?: boolean | any;

  /**
   * Open browser on start
   */
  open?: string | boolean;

  /**
   * Proxy configuration
   */
  proxy?: Record<string, string | ProxyOptions>;

  /**
   * CORS configuration
   */
  cors?: boolean | CorsOptions;

  /**
   * Force pre-bundling
   */
  force?: boolean;

  /**
   * HMR configuration
   */
  hmr?: boolean | HMROptions;

  /**
   * Watch options
   */
  watch?: any;

  /**
   * Middleware mode
   */
  middlewareMode?: boolean | 'html' | 'ssr';

  /**
   * File system options
   */
  fs?: FileSystemOptions;

  /**
   * Origin
   */
  origin?: string;

  /**
   * Pre-transform known direct imports
   */
  preTransformRequests?: boolean;
}

/**
 * Proxy options
 */
export interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  ws?: boolean;
  rewrite?: (path: string) => string;
  configure?: (proxy: any, options: ProxyOptions) => void;
}

/**
 * CORS options
 */
export interface CorsOptions {
  origin?: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * HMR options
 */
export interface HMROptions {
  protocol?: string;
  host?: string;
  port?: number;
  clientPort?: number;
  path?: string;
  timeout?: number;
  overlay?: boolean;
  server?: any;
}

/**
 * File system options
 */
export interface FileSystemOptions {
  /**
   * Restrict files outside of root
   */
  strict?: boolean;

  /**
   * Allow files from these directories
   */
  allow?: string[];

  /**
   * Deny files matching these patterns
   */
  deny?: string[];
}

/**
 * Build options
 */
export interface BuildOptions {
  /**
   * Build target
   */
  target?: string | string[];

  /**
   * Output directory
   */
  outDir?: string;

  /**
   * Assets directory (relative to outDir)
   */
  assetsDir?: string;

  /**
   * Inline assets smaller than this (bytes)
   */
  assetsInlineLimit?: number;

  /**
   * CSS code splitting
   */
  cssCodeSplit?: boolean;

  /**
   * CSS target
   */
  cssTarget?: string | string[];

  /**
   * Generate source maps
   */
  sourcemap?: boolean | 'inline' | 'hidden';

  /**
   * Rollup options
   */
  rollupOptions?: any;

  /**
   * Commonjs options
   */
  commonjsOptions?: any;

  /**
   * Dynamic import polyfill
   */
  dynamicImportVarsOptions?: any;

  /**
   * Library mode options
   */
  lib?: LibraryOptions | false;

  /**
   * Manifest file name
   */
  manifest?: boolean | string;

  /**
   * SSR manifest file name
   */
  ssrManifest?: boolean | string;

  /**
   * SSR build
   */
  ssr?: boolean | string;

  /**
   * Minification option
   */
  minify?: boolean | 'terser' | 'esbuild';

  /**
   * Terser options
   */
  terserOptions?: any;

  /**
   * Write output to disk
   */
  write?: boolean;

  /**
   * Empty output directory on build
   */
  emptyOutDir?: boolean | null;

  /**
   * Report compressed size
   */
  reportCompressedSize?: boolean;

  /**
   * Chunk size warning limit (kB)
   */
  chunkSizeWarningLimit?: number;

  /**
   * Watch mode
   */
  watch?: any | null;
}

/**
 * Library options
 */
export interface LibraryOptions {
  entry: string | string[] | Record<string, string>;
  name?: string;
  formats?: LibraryFormats[];
  fileName?: string | ((format: LibraryFormats, entryName: string) => string);
}

/**
 * Library formats
 */
export type LibraryFormats = 'es' | 'cjs' | 'umd' | 'iife';

/**
 * Preview server options
 */
export interface PreviewOptions {
  host?: string | boolean;
  port?: number;
  strictPort?: boolean;
  https?: boolean | any;
  open?: string | boolean;
  proxy?: Record<string, string | ProxyOptions>;
  cors?: boolean | CorsOptions;
}

/**
 * Dependency optimization options
 */
export interface DepOptimizationOptions {
  /**
   * Entry points
   */
  entries?: string | string[];

  /**
   * Force inclusion
   */
  include?: string[];

  /**
   * Force exclusion
   */
  exclude?: string[];

  /**
   * ESBuild options
   */
  esbuildOptions?: any;

  /**
   * Force optimization
   */
  force?: boolean;

  /**
   * Disable optimization
   */
  disabled?: boolean | 'build' | 'dev';
}

/**
 * SSR options
 */
export interface SSROptions {
  external?: string[];
  noExternal?: string | RegExp | (string | RegExp)[] | true;
  target?: 'node' | 'webworker';
  format?: 'esm' | 'cjs';
}

/**
 * Worker options
 */
export interface WorkerOptions {
  format?: 'es' | 'iife';
  plugins?: PluginOption[];
  rollupOptions?: any;
}

/**
 * Logger interface
 */
export interface Logger {
  info(msg: string, options?: any): void;
  warn(msg: string, options?: any): void;
  warnOnce(msg: string, options?: any): void;
  error(msg: string, options?: any): void;
  clearScreen(type: string): void;
  hasErrorLogged(error: Error | string): boolean;
  hasWarned: boolean;
}
