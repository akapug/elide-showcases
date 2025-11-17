/**
 * Webpack Clone - Module Bundler
 *
 * Main entry point with loaders, plugins, and extensive configuration.
 */

import { EventEmitter } from 'events';
import { resolve, dirname, extname, basename } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

export interface WebpackConfig {
  entry: string | string[] | Record<string, string>;
  output?: OutputConfig;
  module?: ModuleConfig;
  plugins?: Plugin[];
  optimization?: OptimizationConfig;
  devServer?: DevServerConfig;
  mode?: 'development' | 'production';
  devtool?: string | false;
  resolve?: ResolveConfig;
  externals?: Record<string, string>;
}

export interface OutputConfig {
  path?: string;
  filename?: string;
  chunkFilename?: string;
  publicPath?: string;
  library?: string;
  libraryTarget?: string;
}

export interface ModuleConfig {
  rules: Rule[];
}

export interface Rule {
  test: RegExp;
  use: string | LoaderConfig | Array<string | LoaderConfig>;
  exclude?: RegExp;
  include?: RegExp;
  type?: string;
}

export interface LoaderConfig {
  loader: string;
  options?: any;
}

export interface Plugin {
  apply: (compiler: Compiler) => void;
}

export interface OptimizationConfig {
  minimize?: boolean;
  minimizer?: Plugin[];
  splitChunks?: SplitChunksConfig;
  runtimeChunk?: boolean | 'single' | 'multiple';
}

export interface SplitChunksConfig {
  chunks?: 'all' | 'async' | 'initial';
  minSize?: number;
  maxSize?: number;
  minChunks?: number;
  cacheGroups?: Record<string, CacheGroup>;
}

export interface CacheGroup {
  test?: RegExp;
  priority?: number;
  name?: string;
  reuseExistingChunk?: boolean;
}

export interface DevServerConfig {
  static?: string;
  port?: number;
  hot?: boolean;
  open?: boolean;
  proxy?: Record<string, ProxyConfig>;
}

export interface ProxyConfig {
  target: string;
  changeOrigin?: boolean;
}

export interface ResolveConfig {
  extensions?: string[];
  alias?: Record<string, string>;
  modules?: string[];
}

export class Webpack extends EventEmitter {
  private config: WebpackConfig;
  private loaders: Map<string, Loader> = new Map();
  private modules: Map<string, Module> = new Map();
  private chunks: Chunk[] = [];

  constructor(config: WebpackConfig) {
    super();
    this.config = this.normalizeConfig(config);
    this.registerDefaultLoaders();
  }

  async run(): Promise<Stats> {
    const startTime = Date.now();
    console.log('[webpack] Compiling...');

    this.emit('compile');

    try {
      // Process entries
      const entries = this.normalizeEntry(this.config.entry);

      for (const [name, file] of Object.entries(entries)) {
        await this.processEntry(name, file);
      }

      // Apply optimizations
      if (this.config.optimization?.splitChunks) {
        await this.applySplitChunks();
      }

      // Create chunks
      await this.createChunks();

      // Apply plugins
      await this.applyPlugins();

      // Write output
      await this.writeOutput();

      const duration = Date.now() - startTime;
      const stats: Stats = {
        hasErrors: false,
        hasWarnings: false,
        duration,
        assets: [],
      };

      console.log(`[webpack] Compiled successfully in ${duration}ms`);
      this.emit('done', stats);

      return stats;
    } catch (error) {
      console.error('[webpack] Failed to compile');
      this.emit('failed', error);
      throw error;
    }
  }

  private normalizeConfig(config: WebpackConfig): WebpackConfig {
    return {
      ...config,
      output: {
        path: config.output?.path || resolve(process.cwd(), 'dist'),
        filename: config.output?.filename || '[name].js',
        chunkFilename: config.output?.chunkFilename || '[name].chunk.js',
        publicPath: config.output?.publicPath || '/',
        ...config.output,
      },
      mode: config.mode || 'production',
      devtool: config.devtool !== undefined ? config.devtool : 'source-map',
      resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {},
        modules: ['node_modules'],
        ...config.resolve,
      },
    };
  }

  private normalizeEntry(entry: string | string[] | Record<string, string>): Record<string, string> {
    if (typeof entry === 'string') {
      return { main: entry };
    }

    if (Array.isArray(entry)) {
      const entries: Record<string, string> = {};
      entry.forEach((file, index) => {
        const name = basename(file, extname(file));
        entries[name] = file;
      });
      return entries;
    }

    return entry;
  }

  private registerDefaultLoaders(): void {
    // Register built-in loaders
    this.loaders.set('babel-loader', {
      name: 'babel-loader',
      process: async (source, options) => {
        // Simplified Babel transformation
        return source;
      },
    });

    this.loaders.set('css-loader', {
      name: 'css-loader',
      process: async (source, options) => {
        // Simplified CSS processing
        return `module.exports = ${JSON.stringify(source)};`;
      },
    });

    this.loaders.set('style-loader', {
      name: 'style-loader',
      process: async (source, options) => {
        // Simplified style injection
        return `
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(source)};
          document.head.appendChild(style);
        `;
      },
    });
  }

  private async processEntry(name: string, file: string): Promise<void> {
    const resolved = resolve(process.cwd(), file);

    if (!existsSync(resolved)) {
      throw new Error(`Entry not found: ${file}`);
    }

    const module = await this.processModule(resolved);
    module.isEntry = true;
    module.entryName = name;

    this.modules.set(resolved, module);
  }

  private async processModule(filePath: string): Promise<Module> {
    // Check if already processed
    if (this.modules.has(filePath)) {
      return this.modules.get(filePath)!;
    }

    console.log(`[webpack] Processing: ${filePath}`);

    // Read file
    let source = readFileSync(filePath, 'utf-8');

    // Apply loaders
    const ext = extname(filePath);
    const rules = this.config.module?.rules || [];

    for (const rule of rules) {
      if (rule.test.test(filePath)) {
        source = await this.applyLoaders(source, rule.use);
      }
    }

    // Parse dependencies
    const dependencies = this.parseDependencies(source);

    const module: Module = {
      id: filePath,
      source,
      dependencies,
      isEntry: false,
    };

    this.modules.set(filePath, module);

    // Process dependencies
    for (const dep of dependencies) {
      const depPath = this.resolveModule(dep, dirname(filePath));
      if (depPath) {
        await this.processModule(depPath);
      }
    }

    return module;
  }

  private async applyLoaders(source: string, loaders: string | LoaderConfig | Array<string | LoaderConfig>): Promise<string> {
    const loaderArray = Array.isArray(loaders) ? loaders : [loaders];

    let result = source;

    // Apply loaders in reverse order (right to left)
    for (let i = loaderArray.length - 1; i >= 0; i--) {
      const loaderConfig = loaderArray[i];
      const loaderName = typeof loaderConfig === 'string' ? loaderConfig : loaderConfig.loader;
      const loaderOptions = typeof loaderConfig === 'object' ? loaderConfig.options : {};

      const loader = this.loaders.get(loaderName);
      if (loader) {
        result = await loader.process(result, loaderOptions);
      }
    }

    return result;
  }

  private parseDependencies(source: string): string[] {
    const dependencies: string[] = [];

    // Parse imports
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(source)) !== null) {
      dependencies.push(match[1]);
    }

    // Parse require
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(source)) !== null) {
      dependencies.push(match[1]);
    }

    // Parse dynamic imports
    const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicRegex.exec(source)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  private resolveModule(specifier: string, fromDir: string): string | null {
    // Resolve relative paths
    if (specifier.startsWith('.')) {
      const extensions = this.config.resolve?.extensions || ['.js'];

      for (const ext of extensions) {
        const resolved = resolve(fromDir, specifier + ext);
        if (existsSync(resolved)) {
          return resolved;
        }
      }

      const resolved = resolve(fromDir, specifier);
      if (existsSync(resolved)) {
        return resolved;
      }
    }

    // Resolve node_modules
    const nodeModules = resolve(fromDir, 'node_modules', specifier);
    if (existsSync(nodeModules)) {
      return nodeModules;
    }

    return null;
  }

  private async applySplitChunks(): Promise<void> {
    console.log('[webpack] Applying split chunks...');

    const config = this.config.optimization?.splitChunks;
    if (!config) return;

    // Extract vendor chunks
    if (config.cacheGroups) {
      for (const [name, group] of Object.entries(config.cacheGroups)) {
        const modules = Array.from(this.modules.values()).filter(mod =>
          group.test ? group.test.test(mod.id) : false
        );

        if (modules.length > 0) {
          this.chunks.push({
            name,
            modules,
            isEntry: false,
          });
        }
      }
    }
  }

  private async createChunks(): Promise<void> {
    console.log('[webpack] Creating chunks...');

    // Create entry chunks
    for (const module of this.modules.values()) {
      if (module.isEntry) {
        this.chunks.push({
          name: module.entryName!,
          modules: this.getModuleTree(module),
          isEntry: true,
        });
      }
    }
  }

  private getModuleTree(entry: Module): Module[] {
    const result: Module[] = [entry];
    const visited = new Set<string>([entry.id]);

    const queue = [...entry.dependencies];

    while (queue.length > 0) {
      const dep = queue.shift()!;
      const depPath = this.resolveModule(dep, dirname(entry.id));

      if (depPath && !visited.has(depPath)) {
        visited.add(depPath);
        const module = this.modules.get(depPath);
        if (module) {
          result.push(module);
          queue.push(...module.dependencies);
        }
      }
    }

    return result;
  }

  private async applyPlugins(): Promise<void> {
    if (!this.config.plugins) return;

    const compiler: Compiler = this as any;

    for (const plugin of this.config.plugins) {
      plugin.apply(compiler);
    }
  }

  private async writeOutput(): Promise<void> {
    console.log('[webpack] Writing output...');

    const outputPath = this.config.output!.path!;

    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }

    for (const chunk of this.chunks) {
      const filename = this.getChunkFilename(chunk);
      const filePath = resolve(outputPath, filename);

      // Generate chunk code
      let code = '';
      for (const module of chunk.modules) {
        code += `\n// ${module.id}\n`;
        code += module.source + '\n';
      }

      // Wrap in IIFE
      code = `(function() {\n${code}\n})();`;

      writeFileSync(filePath, code, 'utf-8');
      console.log(`[webpack] Emitted: ${filename}`);
    }
  }

  private getChunkFilename(chunk: Chunk): string {
    const template = chunk.isEntry
      ? this.config.output!.filename!
      : this.config.output!.chunkFilename!;

    return template.replace('[name]', chunk.name);
  }
}

export interface Compiler {
  hooks: {
    compile: { tap: (name: string, callback: () => void) => void };
    emit: { tapAsync: (name: string, callback: (compilation: any, cb: () => void) => void) => void };
    done: { tap: (name: string, callback: (stats: Stats) => void) => void };
  };
}

interface Loader {
  name: string;
  process: (source: string, options: any) => Promise<string>;
}

interface Module {
  id: string;
  source: string;
  dependencies: string[];
  isEntry: boolean;
  entryName?: string;
}

interface Chunk {
  name: string;
  modules: Module[];
  isEntry: boolean;
}

export interface Stats {
  hasErrors: boolean;
  hasWarnings: boolean;
  duration: number;
  assets: any[];
}

export default Webpack;
