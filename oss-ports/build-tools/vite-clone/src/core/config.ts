/**
 * Vite Clone - Configuration Management
 *
 * Handles loading, parsing, and resolving Vite configuration files.
 * Supports TypeScript, JavaScript, and JSON config files with deep merging.
 */

import { resolve, dirname, extname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import type {
  UserConfig,
  ResolvedConfig,
  ConfigEnv,
  InlineConfig,
  PluginOption,
  ServerOptions,
  BuildOptions,
  DepOptimizationOptions,
  ResolveOptions,
  CSSOptions,
  PreviewOptions,
} from '../types/config';
import type { Plugin } from '../types/plugin';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<ResolvedConfig> = {
  root: process.cwd(),
  base: '/',
  mode: 'development',
  publicDir: 'public',
  cacheDir: 'node_modules/.vite-clone',
  envPrefix: 'VITE_',
  envDir: process.cwd(),
  logLevel: 'info',
  clearScreen: true,
  appType: 'spa',

  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    https: false,
    open: false,
    cors: false,
    force: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 24678,
      clientPort: undefined,
      path: '/__vite_hmr',
      timeout: 30000,
      overlay: true,
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    middlewareMode: false,
    fs: {
      strict: true,
      allow: [process.cwd()],
      deny: ['.env', '.env.*', '*.{pem,crt}'],
    },
  },

  build: {
    target: 'modules',
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    terserOptions: {},
    write: true,
    emptyOutDir: true,
    manifest: false,
    lib: undefined,
    ssr: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    watch: null,
    rollupOptions: {},
  },

  preview: {
    host: 'localhost',
    port: 4173,
    strictPort: false,
    https: false,
    open: false,
    cors: false,
  },

  optimizeDeps: {
    entries: [],
    exclude: [],
    include: [],
    esbuildOptions: {
      target: 'es2015',
    },
    force: false,
    disabled: false,
  },

  resolve: {
    alias: {},
    dedupe: [],
    conditions: [],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    preserveSymlinks: false,
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
      scopeBehaviour: 'local',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
      hashPrefix: '',
      globalModulePaths: [],
    },
    postcss: {},
    preprocessorOptions: {},
    devSourcemap: false,
  },
};

/**
 * Config file names to search for
 */
const CONFIG_FILES = [
  'vite.config.ts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.cjs',
  'vite.config.json',
];

/**
 * Define configuration with type checking
 */
export function defineConfig(config: UserConfig): UserConfig;
export function defineConfig(config: (env: ConfigEnv) => UserConfig | Promise<UserConfig>): (env: ConfigEnv) => UserConfig | Promise<UserConfig>;
export function defineConfig(config: any): any {
  return config;
}

/**
 * Load configuration from file
 */
export async function loadConfigFromFile(
  configEnv: ConfigEnv,
  configFile?: string,
  configRoot: string = process.cwd(),
): Promise<{ path: string; config: UserConfig } | null> {
  const start = Date.now();

  let resolvedPath: string | undefined = configFile;

  // Search for config file if not specified
  if (!resolvedPath) {
    for (const filename of CONFIG_FILES) {
      const filePath = resolve(configRoot, filename);
      if (existsSync(filePath)) {
        resolvedPath = filePath;
        break;
      }
    }
  }

  if (!resolvedPath) {
    console.log('No config file found, using defaults');
    return null;
  }

  if (!existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  console.log(`Loading config from ${resolvedPath}`);

  let userConfig: UserConfig;

  try {
    // Handle different file types
    const ext = extname(resolvedPath);

    if (ext === '.json') {
      // JSON config
      const content = readFileSync(resolvedPath, 'utf-8');
      userConfig = JSON.parse(content);
    } else {
      // JavaScript/TypeScript config
      // In a real implementation, we would use esbuild or a similar tool to compile TypeScript
      // For now, we'll simulate loading the config
      userConfig = await loadJsConfigFile(resolvedPath, configEnv);
    }

    // If config is a function, call it with the environment
    if (typeof userConfig === 'function') {
      userConfig = await userConfig(configEnv);
    }

    const elapsed = Date.now() - start;
    console.log(`Config loaded in ${elapsed}ms`);

    return {
      path: resolvedPath,
      config: userConfig,
    };
  } catch (error) {
    throw new Error(`Failed to load config from ${resolvedPath}: ${error}`);
  }
}

/**
 * Load JavaScript/TypeScript config file
 * In production, this would use esbuild or similar to compile and load the config
 */
async function loadJsConfigFile(
  configPath: string,
  configEnv: ConfigEnv,
): Promise<UserConfig> {
  // This is a simplified implementation
  // In a real scenario, we would:
  // 1. Use esbuild to compile TypeScript to JavaScript
  // 2. Load the compiled module
  // 3. Handle various export formats (default, named, etc.)

  try {
    // Simulate module loading
    // In Elide, we would use the polyglot APIs to load and execute the module
    const module = await import(configPath);
    const config = module.default || module;

    if (typeof config === 'function') {
      return await config(configEnv);
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to load config file: ${error}`);
  }
}

/**
 * Resolve and normalize configuration
 */
export async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve',
  defaultMode: string = 'development',
): Promise<ResolvedConfig> {
  const mode = inlineConfig.mode || defaultMode;
  const configEnv: ConfigEnv = {
    mode,
    command,
  };

  // Load config from file
  let configFile: { path: string; config: UserConfig } | null = null;
  if (inlineConfig.configFile !== false) {
    configFile = await loadConfigFromFile(
      configEnv,
      inlineConfig.configFile,
      inlineConfig.root,
    );
  }

  // Merge configurations: defaults <- file config <- inline config
  const userConfig = configFile?.config || {};
  const mergedConfig = mergeConfig(
    mergeConfig(DEFAULT_CONFIG as UserConfig, userConfig),
    inlineConfig,
  );

  // Resolve root
  const resolvedRoot = resolvedConfig.root || process.cwd();

  // Resolve plugins
  const plugins = await resolvePlugins(mergedConfig.plugins || []);

  // Create resolved config
  const resolved: ResolvedConfig = {
    ...mergedConfig,
    configFile: configFile?.path,
    configFileDependencies: [],
    inlineConfig,
    root: resolvedRoot,
    base: resolveBase(mergedConfig.base),
    mode,
    command,
    isProduction: mode === 'production',
    plugins,
    server: resolveServerOptions(mergedConfig.server),
    build: resolveBuildOptions(mergedConfig.build),
    preview: resolvePreviewOptions(mergedConfig.preview),
    env: loadEnv(mode, mergedConfig.envDir || resolvedRoot, mergedConfig.envPrefix),
    assetsInclude: createAssetsInclude(),
    logger: createLogger(mergedConfig.logLevel),
    createResolver: createResolverFactory(mergedConfig.resolve),
  } as ResolvedConfig;

  // Run config hooks on plugins
  for (const plugin of plugins) {
    if (plugin.config) {
      const result = await plugin.config(resolved, configEnv);
      if (result) {
        Object.assign(resolved, mergeConfig(resolved, result));
      }
    }
  }

  // Run configResolved hooks
  for (const plugin of plugins) {
    if (plugin.configResolved) {
      await plugin.configResolved(resolved);
    }
  }

  return resolved;
}

/**
 * Merge two configurations deeply
 */
export function mergeConfig<T extends Record<string, any>>(
  base: T,
  override: Partial<T>,
): T {
  const merged = { ...base };

  for (const key in override) {
    const value = override[key];

    if (value === undefined) {
      continue;
    }

    const existing = merged[key];

    if (Array.isArray(existing) && Array.isArray(value)) {
      merged[key] = [...existing, ...value] as any;
    } else if (isObject(existing) && isObject(value)) {
      merged[key] = mergeConfig(existing, value);
    } else {
      merged[key] = value as any;
    }
  }

  return merged;
}

/**
 * Resolve plugins
 */
async function resolvePlugins(plugins: PluginOption[]): Promise<Plugin[]> {
  const resolved: Plugin[] = [];

  for (const plugin of plugins) {
    if (!plugin) continue;

    if (Array.isArray(plugin)) {
      resolved.push(...(await resolvePlugins(plugin)));
    } else if (typeof plugin === 'function') {
      resolved.push(...(await resolvePlugins([await plugin()])));
    } else {
      resolved.push(plugin);
    }
  }

  // Sort plugins by enforce order: pre, normal, post
  return resolved.sort((a, b) => {
    const orderA = a.enforce === 'pre' ? -1 : a.enforce === 'post' ? 1 : 0;
    const orderB = b.enforce === 'pre' ? -1 : b.enforce === 'post' ? 1 : 0;
    return orderA - orderB;
  });
}

/**
 * Resolve base URL
 */
function resolveBase(base: string = '/'): string {
  if (!base.startsWith('/')) {
    throw new Error('base must start with /');
  }
  if (!base.endsWith('/')) {
    base += '/';
  }
  return base;
}

/**
 * Resolve server options
 */
function resolveServerOptions(server?: ServerOptions): Required<ServerOptions> {
  return mergeConfig(DEFAULT_CONFIG.server!, server || {}) as Required<ServerOptions>;
}

/**
 * Resolve build options
 */
function resolveBuildOptions(build?: BuildOptions): Required<BuildOptions> {
  return mergeConfig(DEFAULT_CONFIG.build!, build || {}) as Required<BuildOptions>;
}

/**
 * Resolve preview options
 */
function resolvePreviewOptions(preview?: PreviewOptions): Required<PreviewOptions> {
  return mergeConfig(DEFAULT_CONFIG.preview!, preview || {}) as Required<PreviewOptions>;
}

/**
 * Load environment variables
 */
function loadEnv(
  mode: string,
  envDir: string,
  prefix: string = 'VITE_',
): Record<string, string> {
  const env: Record<string, string> = {};

  const envFiles = [
    `.env`,
    `.env.local`,
    `.env.${mode}`,
    `.env.${mode}.local`,
  ];

  for (const file of envFiles) {
    const path = resolve(envDir, file);
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      const parsed = parseEnv(content);

      // Only include variables with the specified prefix
      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith(prefix)) {
          env[key] = value;
        }
      }
    }
  }

  return env;
}

/**
 * Parse .env file content
 */
function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (let line of content.split('\n')) {
    // Remove comments
    const commentIndex = line.indexOf('#');
    if (commentIndex !== -1) {
      line = line.slice(0, commentIndex);
    }

    line = line.trim();

    if (!line) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

/**
 * Create asset inclusion test function
 */
function createAssetsInclude(): (file: string) => boolean {
  const KNOWN_ASSET_TYPES = new Set([
    // images
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'avif',
    // media
    'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac',
    // fonts
    'woff', 'woff2', 'eot', 'ttf', 'otf',
    // other
    'pdf', 'txt',
  ]);

  return (file: string) => {
    const ext = extname(file).slice(1).toLowerCase();
    return KNOWN_ASSET_TYPES.has(ext);
  };
}

/**
 * Create logger
 */
function createLogger(logLevel: string = 'info') {
  const levels = ['silent', 'error', 'warn', 'info'];
  const currentLevel = levels.indexOf(logLevel);

  return {
    info: (...args: any[]) => {
      if (currentLevel >= 3) console.log('[vite]', ...args);
    },
    warn: (...args: any[]) => {
      if (currentLevel >= 2) console.warn('[vite]', ...args);
    },
    error: (...args: any[]) => {
      if (currentLevel >= 1) console.error('[vite]', ...args);
    },
    clearScreen: (type: string) => {
      if (currentLevel >= 3) {
        console.clear();
        console.log(`[vite] ${type}`);
      }
    },
  };
}

/**
 * Create resolver factory
 */
function createResolverFactory(options?: ResolveOptions) {
  return () => ({
    async resolve(id: string, importer?: string) {
      // Simplified resolver
      // In production, this would handle:
      // - Alias resolution
      // - Node module resolution
      // - Extension resolution
      // - Main field resolution
      return null;
    },
  });
}

/**
 * Check if value is a plain object
 */
function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Normalize path separators
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Check if path is external
 */
export function isExternalUrl(url: string): boolean {
  return /^(https?:)?\/\//.test(url);
}

/**
 * Clean URL from query and hash
 */
export function cleanUrl(url: string): string {
  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');

  if (queryIndex !== -1) {
    url = url.slice(0, queryIndex);
  }

  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }

  return url;
}
