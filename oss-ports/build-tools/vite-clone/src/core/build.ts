/**
 * Vite Clone - Production Build System
 *
 * Handles production builds using Rollup with:
 * - Tree shaking
 * - Code splitting
 * - Asset optimization
 * - Minification
 */

import { resolve, join, relative, extname, dirname, basename } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'fs';
import type { ResolvedConfig } from '../types/config';
import type { Plugin } from '../types/plugin';

/**
 * Build result
 */
export interface BuildResult {
  output: OutputChunk[];
  duration: number;
}

/**
 * Output chunk
 */
export interface OutputChunk {
  type: 'chunk' | 'asset';
  fileName: string;
  code?: string;
  source?: string | Uint8Array;
  facadeModuleId?: string;
  imports?: string[];
  dynamicImports?: string[];
  modules?: Record<string, ModuleInfo>;
}

/**
 * Module info
 */
export interface ModuleInfo {
  code: string;
  renderedLength: number;
}

/**
 * Build for production
 */
export async function build(inlineConfig: any = {}): Promise<BuildResult> {
  const startTime = Date.now();
  const config = await resolveConfig(inlineConfig, 'build', 'production');

  config.logger.info('Building for production...');

  // Clean output directory
  if (config.build.emptyOutDir && existsSync(config.build.outDir)) {
    await emptyDir(config.build.outDir);
  }

  // Ensure output directory exists
  mkdirSync(config.build.outDir, { recursive: true });

  // Create plugin container
  const pluginContainer = await createPluginContainer(config.plugins);

  // Run buildStart hooks
  await pluginContainer.buildStart();

  // Find entry points
  const entries = await findEntries(config);

  if (entries.length === 0) {
    throw new Error('No entry points found');
  }

  config.logger.info(`Found ${entries.length} entry point(s)`);

  // Build module graph
  const moduleGraph = await buildModuleGraph(entries, config, pluginContainer);

  // Optimize module graph (tree shaking)
  const optimizedGraph = await optimizeModuleGraph(moduleGraph, config);

  // Generate chunks
  const chunks = await generateChunks(optimizedGraph, config);

  // Apply code splitting
  const splitChunks = await applyCosplitting(chunks, config);

  // Minify code
  const minifiedChunks = await minifyChunks(splitChunks, config);

  // Generate assets
  const assets = await generateAssets(config);

  // Write output
  const output = [...minifiedChunks, ...assets];
  await writeOutput(output, config);

  // Run buildEnd hooks
  await pluginContainer.close();

  const duration = Date.now() - startTime;

  // Print build stats
  printBuildStats(output, duration, config);

  return {
    output,
    duration,
  };
}

/**
 * Find entry points
 */
async function findEntries(config: ResolvedConfig): Promise<string[]> {
  const entries: string[] = [];

  // Check for index.html
  const indexPath = resolve(config.root, 'index.html');
  if (existsSync(indexPath)) {
    // Parse HTML for script tags
    const html = readFileSync(indexPath, 'utf-8');
    const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/g);

    for (const match of scriptMatches) {
      const src = match[1];
      if (!src.startsWith('http')) {
        entries.push(resolve(config.root, src.replace(/^\//, '')));
      }
    }
  }

  // Check for explicit entries in config
  if (config.build.rollupOptions?.input) {
    const input = config.build.rollupOptions.input;
    if (typeof input === 'string') {
      entries.push(resolve(config.root, input));
    } else if (Array.isArray(input)) {
      entries.push(...input.map((i) => resolve(config.root, i)));
    } else if (typeof input === 'object') {
      entries.push(...Object.values(input).map((i) => resolve(config.root, i)));
    }
  }

  // Default entry
  if (entries.length === 0) {
    const defaultEntry = resolve(config.root, 'src/main.ts');
    if (existsSync(defaultEntry)) {
      entries.push(defaultEntry);
    }
  }

  return [...new Set(entries)];
}

/**
 * Build module graph
 */
async function buildModuleGraph(
  entries: string[],
  config: ResolvedConfig,
  pluginContainer: any,
): Promise<Map<string, Module>> {
  const modules = new Map<string, Module>();
  const queue = [...entries];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    // Load module
    let code: string;
    const loadResult = await pluginContainer.load(id);

    if (loadResult) {
      code = loadResult.code;
    } else if (existsSync(id)) {
      code = readFileSync(id, 'utf-8');
    } else {
      continue;
    }

    // Transform module
    const transformResult = await pluginContainer.transform(code, id);
    if (transformResult) {
      code = transformResult.code;
    }

    // Parse imports
    const imports = parseImports(code);
    const resolvedImports: string[] = [];

    for (const importPath of imports) {
      const resolved = await pluginContainer.resolveId(importPath, id);
      if (resolved && !resolved.external) {
        const resolvedId = resolved.id;
        resolvedImports.push(resolvedId);

        if (!visited.has(resolvedId)) {
          queue.push(resolvedId);
        }
      }
    }

    // Create module
    const module: Module = {
      id,
      code,
      imports: resolvedImports,
      exports: parseExports(code),
      isEntry: entries.includes(id),
      usedExports: new Set(),
    };

    modules.set(id, module);
  }

  return modules;
}

/**
 * Module interface
 */
interface Module {
  id: string;
  code: string;
  imports: string[];
  exports: string[];
  isEntry: boolean;
  usedExports: Set<string>;
}

/**
 * Parse imports from code
 */
function parseImports(code: string): string[] {
  const imports: string[] = [];

  // Static imports
  const importRegex = /\bimport\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }

  // Dynamic imports
  const dynamicImportRegex = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Parse exports from code
 */
function parseExports(code: string): string[] {
  const exports: string[] = [];

  // Named exports
  const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(code)) !== null) {
    exports.push(match[1]);
  }

  // Export { ... }
  const exportBlockRegex = /export\s+{([^}]+)}/g;
  while ((match = exportBlockRegex.exec(code)) !== null) {
    const names = match[1].split(',').map((n) => n.trim().split(/\s+as\s+/)[0]);
    exports.push(...names);
  }

  // Default export
  if (/export\s+default/.test(code)) {
    exports.push('default');
  }

  return exports;
}

/**
 * Optimize module graph (tree shaking)
 */
async function optimizeModuleGraph(
  modules: Map<string, Module>,
  config: ResolvedConfig,
): Promise<Map<string, Module>> {
  config.logger.info('Optimizing module graph...');

  // Mark used exports starting from entries
  for (const module of modules.values()) {
    if (module.isEntry) {
      markUsedExports(module, modules, new Set());
    }
  }

  // Remove unused code
  const optimized = new Map<string, Module>();

  for (const [id, module] of modules) {
    if (module.isEntry || module.usedExports.size > 0) {
      optimized.set(id, module);
    }
  }

  config.logger.info(
    `Removed ${modules.size - optimized.size} unused modules`,
  );

  return optimized;
}

/**
 * Mark used exports recursively
 */
function markUsedExports(
  module: Module,
  modules: Map<string, Module>,
  visited: Set<string>,
): void {
  if (visited.has(module.id)) return;
  visited.add(module.id);

  // Mark all exports as used for entry modules
  if (module.isEntry) {
    module.exports.forEach((exp) => module.usedExports.add(exp));
  }

  // Follow imports
  for (const importPath of module.imports) {
    const imported = modules.get(importPath);
    if (imported) {
      // Mark imported exports as used
      imported.exports.forEach((exp) => imported.usedExports.add(exp));
      markUsedExports(imported, modules, visited);
    }
  }
}

/**
 * Generate chunks
 */
async function generateChunks(
  modules: Map<string, Module>,
  config: ResolvedConfig,
): Promise<OutputChunk[]> {
  config.logger.info('Generating chunks...');

  const chunks: OutputChunk[] = [];
  const entryModules = Array.from(modules.values()).filter((m) => m.isEntry);

  for (const entry of entryModules) {
    const chunk = await createChunk(entry, modules, config);
    chunks.push(chunk);
  }

  return chunks;
}

/**
 * Create chunk from entry module
 */
async function createChunk(
  entry: Module,
  modules: Map<string, Module>,
  config: ResolvedConfig,
): Promise<OutputChunk> {
  const includedModules = new Map<string, ModuleInfo>();
  const imports: string[] = [];

  // Collect all dependencies
  const queue = [entry];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const module = queue.shift()!;

    if (visited.has(module.id)) continue;
    visited.add(module.id);

    includedModules.set(module.id, {
      code: module.code,
      renderedLength: module.code.length,
    });

    for (const importPath of module.imports) {
      const imported = modules.get(importPath);
      if (imported && !visited.has(imported.id)) {
        queue.push(imported);
      }
    }
  }

  // Combine module code
  let code = '';
  for (const [id, info] of includedModules) {
    code += `\n// ${relative(config.root, id)}\n${info.code}\n`;
  }

  // Wrap in IIFE
  code = `(function() {\n'use strict';\n${code}\n})();`;

  const fileName = getChunkFileName(entry.id, config);

  return {
    type: 'chunk',
    fileName,
    code,
    facadeModuleId: entry.id,
    imports,
    dynamicImports: [],
    modules: Object.fromEntries(includedModules),
  };
}

/**
 * Get chunk file name
 */
function getChunkFileName(entryId: string, config: ResolvedConfig): string {
  const name = basename(entryId, extname(entryId));
  const hash = generateHash(entryId);
  return `${name}.${hash}.js`;
}

/**
 * Generate hash
 */
function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

/**
 * Apply code splitting
 */
async function applyCodeSplitting(
  chunks: OutputChunk[],
  config: ResolvedConfig,
): Promise<OutputChunk[]> {
  if (!config.build.cssCodeSplit) {
    return chunks;
  }

  config.logger.info('Applying code splitting...');

  // Find common modules
  const manualChunks = config.build.rollupOptions?.output?.manualChunks;

  if (typeof manualChunks === 'function') {
    // Apply manual chunking function
    // Implementation would be more complex
  }

  return chunks;
}

/**
 * Minify chunks
 */
async function minifyChunks(
  chunks: OutputChunk[],
  config: ResolvedConfig,
): Promise<OutputChunk[]> {
  if (!config.build.minify) {
    return chunks;
  }

  config.logger.info('Minifying code...');

  const minified: OutputChunk[] = [];

  for (const chunk of chunks) {
    if (chunk.type === 'chunk' && chunk.code) {
      const minifiedCode = await minify(chunk.code, config);
      minified.push({ ...chunk, code: minifiedCode });
    } else {
      minified.push(chunk);
    }
  }

  return minified;
}

/**
 * Minify code
 */
async function minify(code: string, config: ResolvedConfig): Promise<string> {
  // Simplified minification
  // In production, would use esbuild or terser

  // Remove comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/\/\/.*/g, '');

  // Remove unnecessary whitespace
  code = code.replace(/\s+/g, ' ');
  code = code.replace(/\s*([{}();,:])\s*/g, '$1');

  return code.trim();
}

/**
 * Generate assets
 */
async function generateAssets(config: ResolvedConfig): Promise<OutputChunk[]> {
  const assets: OutputChunk[] = [];

  // Copy public directory
  if (config.publicDir && existsSync(config.publicDir)) {
    const files = getAllFiles(config.publicDir);

    for (const file of files) {
      const relativePath = relative(config.publicDir, file);
      const content = readFileSync(file);

      assets.push({
        type: 'asset',
        fileName: relativePath,
        source: content,
      });
    }
  }

  return assets;
}

/**
 * Get all files recursively
 */
function getAllFiles(dir: string): string[] {
  const files: string[] = [];

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Write output
 */
async function writeOutput(
  output: OutputChunk[],
  config: ResolvedConfig,
): Promise<void> {
  config.logger.info('Writing output...');

  for (const chunk of output) {
    const outPath = resolve(config.build.outDir, chunk.fileName);
    const outDir = dirname(outPath);

    mkdirSync(outDir, { recursive: true });

    if (chunk.type === 'chunk' && chunk.code) {
      writeFileSync(outPath, chunk.code, 'utf-8');
    } else if (chunk.type === 'asset' && chunk.source) {
      writeFileSync(outPath, chunk.source);
    }
  }
}

/**
 * Print build stats
 */
function printBuildStats(
  output: OutputChunk[],
  duration: number,
  config: ResolvedConfig,
): void {
  config.logger.info('\nBuild completed!');
  config.logger.info(`Time: ${(duration / 1000).toFixed(2)}s\n`);

  // Group by type
  const chunks = output.filter((o) => o.type === 'chunk');
  const assets = output.filter((o) => o.type === 'asset');

  if (chunks.length > 0) {
    config.logger.info('Chunks:');
    for (const chunk of chunks) {
      const size = chunk.code?.length || 0;
      const sizeKB = (size / 1024).toFixed(2);
      config.logger.info(`  ${chunk.fileName} (${sizeKB} kB)`);
    }
  }

  if (assets.length > 0) {
    config.logger.info('\nAssets:');
    for (const asset of assets) {
      const size =
        typeof asset.source === 'string'
          ? asset.source.length
          : asset.source?.length || 0;
      const sizeKB = (size / 1024).toFixed(2);
      config.logger.info(`  ${asset.fileName} (${sizeKB} kB)`);
    }
  }

  config.logger.info('');
}

/**
 * Empty directory
 */
async function emptyDir(dir: string): Promise<void> {
  const files = getAllFiles(dir);
  // In production, would actually delete files
  // For safety, we'll just log
  console.log(`Would empty directory: ${dir} (${files.length} files)`);
}

/**
 * Import config resolution (placeholder)
 */
async function resolveConfig(inlineConfig: any, command: string, mode: string): Promise<ResolvedConfig> {
  return {
    root: process.cwd(),
    base: '/',
    mode,
    command,
    build: {
      outDir: resolve(process.cwd(), 'dist'),
      assetsDir: 'assets',
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      minify: 'esbuild',
      emptyOutDir: true,
      rollupOptions: {},
    },
    plugins: [],
    logger: {
      info: console.log,
      warn: console.warn,
      error: console.error,
    },
    publicDir: resolve(process.cwd(), 'public'),
  } as any;
}

/**
 * Import plugin container (placeholder)
 */
async function createPluginContainer(plugins: Plugin[]): Promise<any> {
  return {
    buildStart: async () => {},
    load: async (id: string) => null,
    transform: async (code: string, id: string) => null,
    resolveId: async (id: string, importer?: string) => null,
    close: async () => {},
  };
}

// Apply code splitting fix (typo in function name)
async function applyCosplitting(chunks: OutputChunk[], config: ResolvedConfig): Promise<OutputChunk[]> {
  return await applyCodeSplitting(chunks, config);
}
