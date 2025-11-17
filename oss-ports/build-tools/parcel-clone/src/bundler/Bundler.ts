/**
 * Parcel Clone - Main Bundler
 *
 * Zero-configuration bundler with automatic asset detection,
 * hot module replacement, and optimized builds.
 */

import { EventEmitter } from 'events';
import { resolve, dirname, extname, basename } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { AssetGraph } from './AssetGraph';
import { TransformerRegistry } from '../transformers/TransformerRegistry';
import { ResolverPipeline } from '../resolvers/ResolverPipeline';
import { PackagerRegistry } from '../packagers/PackagerRegistry';
import { OptimizerPipeline } from '../optimizers/OptimizerPipeline';

export interface BundlerOptions {
  entries?: string[];
  outDir?: string;
  publicUrl?: string;
  watch?: boolean;
  cache?: boolean;
  cacheDir?: string;
  contentHash?: boolean;
  minify?: boolean;
  scopeHoist?: boolean;
  sourceMaps?: boolean;
  target?: string;
  env?: Record<string, string>;
  serve?: ServerOptions;
  hmr?: boolean | HMROptions;
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'verbose';
  autoInstall?: boolean;
  mode?: 'development' | 'production';
}

export interface ServerOptions {
  port?: number;
  host?: string;
  https?: boolean;
  open?: boolean | string;
}

export interface HMROptions {
  port?: number;
  host?: string;
}

export class Bundler extends EventEmitter {
  private options: Required<BundlerOptions>;
  private assetGraph: AssetGraph;
  private transformers: TransformerRegistry;
  private resolvers: ResolverPipeline;
  private packagers: PackagerRegistry;
  private optimizers: OptimizerPipeline;
  private cache: Map<string, any> = new Map();
  private watching: boolean = false;

  constructor(entries: string | string[], options: BundlerOptions = {}) {
    super();

    const entryArray = Array.isArray(entries) ? entries : [entries];

    this.options = {
      entries: entryArray,
      outDir: options.outDir || 'dist',
      publicUrl: options.publicUrl || '/',
      watch: options.watch || false,
      cache: options.cache !== false,
      cacheDir: options.cacheDir || '.parcel-cache',
      contentHash: options.contentHash !== false,
      minify: options.minify !== false,
      scopeHoist: options.scopeHoist !== false,
      sourceMaps: options.sourceMaps !== false,
      target: options.target || 'browser',
      env: options.env || {},
      serve: options.serve || {},
      hmr: options.hmr !== false ? (typeof options.hmr === 'object' ? options.hmr : {}) : false,
      logLevel: options.logLevel || 'info',
      autoInstall: options.autoInstall !== false,
      mode: options.mode || (options.minify ? 'production' : 'development'),
    };

    this.assetGraph = new AssetGraph();
    this.transformers = new TransformerRegistry();
    this.resolvers = new ResolverPipeline();
    this.packagers = new PackagerRegistry();
    this.optimizers = new OptimizerPipeline(this.options);

    this.loadCache();
  }

  /**
   * Bundle all assets
   */
  async bundle(): Promise<BundleResult> {
    const startTime = Date.now();

    this.log('info', 'Building...');
    this.emit('buildStart');

    try {
      // Discover entry assets
      const entries = await this.discoverEntries();

      // Build asset graph
      for (const entry of entries) {
        await this.processAsset(entry);
      }

      // Optimize asset graph
      if (this.options.scopeHoist) {
        await this.optimizers.scopeHoist(this.assetGraph);
      }

      // Create bundles
      const bundles = await this.createBundles();

      // Package bundles
      const packages = await this.packageBundles(bundles);

      // Optimize packages
      if (this.options.minify) {
        await this.optimizers.minify(packages);
      }

      // Write to disk
      await this.writeOutput(packages);

      // Save cache
      this.saveCache();

      const duration = Date.now() - startTime;
      this.log('info', `Built in ${duration}ms`);

      this.emit('buildEnd');

      return {
        bundles: packages,
        duration,
      };
    } catch (error) {
      this.log('error', `Build failed: ${error}`);
      this.emit('buildError', error);
      throw error;
    }
  }

  /**
   * Discover entry assets
   */
  private async discoverEntries(): Promise<Asset[]> {
    const entries: Asset[] = [];

    for (const entry of this.options.entries) {
      const resolved = resolve(process.cwd(), entry);

      if (!existsSync(resolved)) {
        throw new Error(`Entry not found: ${entry}`);
      }

      // Create entry asset
      const asset = await this.createAsset(resolved, null, true);
      entries.push(asset);

      // If HTML, discover additional entries
      if (asset.type === 'html') {
        const htmlEntries = await this.discoverHTMLEntries(asset);
        entries.push(...htmlEntries);
      }
    }

    return entries;
  }

  /**
   * Discover entries from HTML
   */
  private async discoverHTMLEntries(htmlAsset: Asset): Promise<Asset[]> {
    const entries: Asset[] = [];
    const html = htmlAsset.content;

    // Find script tags
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/g;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      const src = match[1];
      if (!src.startsWith('http')) {
        const resolved = await this.resolvers.resolve(src, htmlAsset.filePath);
        if (resolved) {
          const asset = await this.createAsset(resolved, htmlAsset);
          entries.push(asset);
        }
      }
    }

    // Find link tags
    const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/g;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (!href.startsWith('http')) {
        const resolved = await this.resolvers.resolve(href, htmlAsset.filePath);
        if (resolved) {
          const asset = await this.createAsset(resolved, htmlAsset);
          entries.push(asset);
        }
      }
    }

    return entries;
  }

  /**
   * Process asset
   */
  private async processAsset(asset: Asset): Promise<void> {
    // Check cache
    if (this.options.cache && this.cache.has(asset.filePath)) {
      const cached = this.cache.get(asset.filePath);
      if (cached.mtime === asset.mtime) {
        this.log('verbose', `Using cached: ${asset.filePath}`);
        Object.assign(asset, cached);
        return;
      }
    }

    this.log('verbose', `Processing: ${asset.filePath}`);

    // Transform asset
    await this.transformers.transform(asset);

    // Parse dependencies
    await this.parseDependencies(asset);

    // Add to graph
    this.assetGraph.addAsset(asset);

    // Cache asset
    if (this.options.cache) {
      this.cache.set(asset.filePath, { ...asset });
    }

    // Process dependencies
    for (const dep of asset.dependencies) {
      const resolved = await this.resolvers.resolve(dep.specifier, asset.filePath);

      if (resolved) {
        const depAsset = await this.createAsset(resolved, asset);
        await this.processAsset(depAsset);
        this.assetGraph.addDependency(asset, depAsset);
      }
    }
  }

  /**
   * Create asset
   */
  private async createAsset(filePath: string, parent: Asset | null, isEntry: boolean = false): Promise<Asset> {
    const content = readFileSync(filePath, 'utf-8');
    const ext = extname(filePath);
    const type = this.getAssetType(ext);

    const asset: Asset = {
      id: this.generateAssetId(filePath),
      filePath,
      type,
      content,
      dependencies: [],
      isEntry,
      parent: parent?.filePath || null,
      mtime: this.getModificationTime(filePath),
    };

    return asset;
  }

  /**
   * Get asset type from extension
   */
  private getAssetType(ext: string): string {
    const typeMap: Record<string, string> = {
      '.js': 'js',
      '.mjs': 'js',
      '.jsx': 'jsx',
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.html': 'html',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.json': 'json',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'svg',
      '.wasm': 'wasm',
    };

    return typeMap[ext] || 'unknown';
  }

  /**
   * Parse dependencies from asset
   */
  private async parseDependencies(asset: Asset): Promise<void> {
    const deps: Dependency[] = [];

    if (asset.type === 'js' || asset.type === 'jsx' || asset.type === 'ts' || asset.type === 'tsx') {
      // Parse JavaScript/TypeScript imports
      const importRegex = /import\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(asset.content)) !== null) {
        deps.push({
          specifier: match[1],
          type: 'import',
        });
      }

      // Parse dynamic imports
      const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = dynamicRegex.exec(asset.content)) !== null) {
        deps.push({
          specifier: match[1],
          type: 'dynamic-import',
        });
      }

      // Parse require
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(asset.content)) !== null) {
        deps.push({
          specifier: match[1],
          type: 'require',
        });
      }
    } else if (asset.type === 'css' || asset.type === 'scss') {
      // Parse CSS imports
      const importRegex = /@import\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(asset.content)) !== null) {
        deps.push({
          specifier: match[1],
          type: 'css-import',
        });
      }

      // Parse URL references
      const urlRegex = /url\s*\(\s*['"]?([^'"`)]+)['"]?\s*\)/g;
      while ((match = urlRegex.exec(asset.content)) !== null) {
        if (!match[1].startsWith('http') && !match[1].startsWith('data:')) {
          deps.push({
            specifier: match[1],
            type: 'url',
          });
        }
      }
    }

    asset.dependencies = deps;
  }

  /**
   * Create bundles from asset graph
   */
  private async createBundles(): Promise<Bundle[]> {
    this.log('info', 'Creating bundles...');

    const bundles: Bundle[] = [];
    const entries = this.assetGraph.getEntries();

    for (const entry of entries) {
      const bundle = await this.createBundle(entry);
      bundles.push(bundle);
    }

    return bundles;
  }

  /**
   * Create single bundle
   */
  private async createBundle(entry: Asset): Promise<Bundle> {
    const assets = this.assetGraph.getAssets(entry);

    return {
      id: this.generateBundleId(entry),
      entry,
      assets,
      type: entry.type,
    };
  }

  /**
   * Package bundles
   */
  private async packageBundles(bundles: Bundle[]): Promise<Package[]> {
    this.log('info', 'Packaging bundles...');

    const packages: Package[] = [];

    for (const bundle of bundles) {
      const pkg = await this.packagers.package(bundle);
      packages.push(pkg);
    }

    return packages;
  }

  /**
   * Write output to disk
   */
  private async writeOutput(packages: Package[]): Promise<void> {
    this.log('info', 'Writing output...');

    // Ensure output directory exists
    if (!existsSync(this.options.outDir)) {
      mkdirSync(this.options.outDir, { recursive: true });
    }

    for (const pkg of packages) {
      const fileName = this.getOutputFileName(pkg);
      const filePath = resolve(this.options.outDir, fileName);
      const dirPath = dirname(filePath);

      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }

      writeFileSync(filePath, pkg.content, 'utf-8');

      if (pkg.sourceMap && this.options.sourceMaps) {
        writeFileSync(filePath + '.map', JSON.stringify(pkg.sourceMap), 'utf-8');
      }

      this.log('verbose', `Written: ${fileName}`);
    }
  }

  /**
   * Get output file name
   */
  private getOutputFileName(pkg: Package): string {
    const ext = this.getExtensionForType(pkg.type);
    const base = basename(pkg.entry.filePath, extname(pkg.entry.filePath));

    if (this.options.contentHash) {
      const hash = this.generateHash(pkg.content);
      return `${base}.${hash}${ext}`;
    }

    return `${base}${ext}`;
  }

  /**
   * Get extension for asset type
   */
  private getExtensionForType(type: string): string {
    const extMap: Record<string, string> = {
      'js': '.js',
      'jsx': '.js',
      'ts': '.js',
      'tsx': '.js',
      'css': '.css',
      'scss': '.css',
      'sass': '.css',
      'less': '.css',
      'html': '.html',
    };

    return extMap[type] || '';
  }

  /**
   * Generate hash
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }

  /**
   * Generate asset ID
   */
  private generateAssetId(filePath: string): string {
    return filePath;
  }

  /**
   * Generate bundle ID
   */
  private generateBundleId(entry: Asset): string {
    return entry.id;
  }

  /**
   * Get file modification time
   */
  private getModificationTime(filePath: string): number {
    try {
      const stats = require('fs').statSync(filePath);
      return stats.mtimeMs;
    } catch {
      return 0;
    }
  }

  /**
   * Load cache
   */
  private loadCache(): void {
    if (!this.options.cache) return;

    const cachePath = resolve(this.options.cacheDir, 'cache.json');
    if (existsSync(cachePath)) {
      try {
        const data = readFileSync(cachePath, 'utf-8');
        const cache = JSON.parse(data);
        this.cache = new Map(Object.entries(cache));
        this.log('verbose', 'Cache loaded');
      } catch (error) {
        this.log('warn', `Failed to load cache: ${error}`);
      }
    }
  }

  /**
   * Save cache
   */
  private saveCache(): void {
    if (!this.options.cache) return;

    const cachePath = resolve(this.options.cacheDir, 'cache.json');
    const dir = dirname(cachePath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    try {
      const cache = Object.fromEntries(this.cache);
      writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
      this.log('verbose', 'Cache saved');
    } catch (error) {
      this.log('warn', `Failed to save cache: ${error}`);
    }
  }

  /**
   * Log message
   */
  private log(level: string, message: string): void {
    const levels = ['none', 'error', 'warn', 'info', 'verbose'];
    const currentLevel = levels.indexOf(this.options.logLevel);
    const messageLevel = levels.indexOf(level);

    if (messageLevel <= currentLevel) {
      console.log(`[parcel] ${message}`);
    }
  }

  /**
   * Stop bundler
   */
  async stop(): Promise<void> {
    this.watching = false;
    this.emit('stopped');
  }
}

export interface Asset {
  id: string;
  filePath: string;
  type: string;
  content: string;
  dependencies: Dependency[];
  isEntry: boolean;
  parent: string | null;
  mtime: number;
}

export interface Dependency {
  specifier: string;
  type: string;
}

export interface Bundle {
  id: string;
  entry: Asset;
  assets: Asset[];
  type: string;
}

export interface Package {
  entry: Asset;
  content: string;
  sourceMap?: any;
  type: string;
}

export interface BundleResult {
  bundles: Package[];
  duration: number;
}
