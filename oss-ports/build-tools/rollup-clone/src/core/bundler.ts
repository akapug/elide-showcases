/**
 * Rollup Clone - Core Bundler
 *
 * Main bundling logic with tree shaking, code splitting, and module resolution.
 */

import { resolve, dirname, basename, extname, relative, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import type { InputOptions, OutputOptions, RollupBuild, RollupOutput, RollupCache } from '../types';
import { ModuleGraph } from './moduleGraph';
import { TreeShaker } from './treeShaker';
import { CodeSplitter } from './codeSplitter';
import { PluginDriver } from './pluginDriver';
import { generateCode } from './codeGenerator';
import { generateSourceMap } from './sourceMap';

/**
 * Create a bundle from input options
 */
export async function rollup(inputOptions: InputOptions): Promise<RollupBuild> {
  const startTime = Date.now();

  // Normalize input options
  const options = normalizeInputOptions(inputOptions);

  // Create plugin driver
  const pluginDriver = new PluginDriver(options.plugins || []);

  // Run options hook
  const modifiedOptions = await pluginDriver.hookParallel('options', options);
  const finalOptions = modifiedOptions || options;

  // Run buildStart hook
  await pluginDriver.hookParallel('buildStart', finalOptions);

  // Create module graph
  const moduleGraph = new ModuleGraph(finalOptions, pluginDriver);

  // Build the module graph
  await buildModuleGraph(moduleGraph, finalOptions);

  // Create tree shaker
  const treeShaker = new TreeShaker(finalOptions.treeshake);

  // Perform tree shaking
  await treeShaker.shake(moduleGraph);

  // Create build object
  const build: RollupBuild = {
    cache: createCache(moduleGraph),

    async generate(outputOptions: OutputOptions): Promise<RollupOutput> {
      return await generateOutput(moduleGraph, outputOptions, pluginDriver, treeShaker);
    },

    async write(outputOptions: OutputOptions): Promise<RollupOutput> {
      const output = await this.generate(outputOptions);

      // Write files to disk
      for (const chunk of output.output) {
        const filePath = resolve(outputOptions.dir || dirname(outputOptions.file!), chunk.fileName);
        const dirPath = dirname(filePath);

        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true });
        }

        if (chunk.type === 'chunk') {
          writeFileSync(filePath, chunk.code, 'utf-8');
          if (chunk.map) {
            writeFileSync(filePath + '.map', JSON.stringify(chunk.map), 'utf-8');
          }
        } else if (chunk.type === 'asset') {
          writeFileSync(filePath, chunk.source);
        }
      }

      return output;
    },

    async close(): Promise<void> {
      await pluginDriver.hookParallel('buildEnd', null);
      await pluginDriver.hookParallel('closeBundle');
    },

    closed: false,

    watchFiles: moduleGraph.getWatchFiles(),
  };

  const elapsed = Date.now() - startTime;
  console.log(`Bundle created in ${elapsed}ms`);

  return build;
}

/**
 * Build module graph from entry points
 */
async function buildModuleGraph(
  moduleGraph: ModuleGraph,
  options: InputOptions,
): Promise<void> {
  // Get entry points
  const entries = normalizeInput(options.input);

  // Process each entry
  for (const [name, file] of Object.entries(entries)) {
    const resolved = resolve(options.root || process.cwd(), file);
    await moduleGraph.addEntry(name, resolved);
  }

  // Process module queue
  await moduleGraph.process();
}

/**
 * Generate output from module graph
 */
async function generateOutput(
  moduleGraph: ModuleGraph,
  outputOptions: OutputOptions,
  pluginDriver: PluginDriver,
  treeShaker: TreeShaker,
): Promise<RollupOutput> {
  // Normalize output options
  const options = normalizeOutputOptions(outputOptions);

  // Run renderStart hook
  await pluginDriver.hookParallel('renderStart', options, {});

  // Create code splitter
  const codeSplitter = new CodeSplitter(options, moduleGraph);

  // Split code into chunks
  const chunks = await codeSplitter.split();

  // Generate code for each chunk
  const output: RollupOutput = {
    output: [],
  };

  for (const chunk of chunks) {
    // Run renderChunk hook
    let code = chunk.code;
    let map = chunk.map;

    const renderResult = await pluginDriver.hookSeq('renderChunk', code, chunk, options);

    if (renderResult) {
      if (typeof renderResult === 'string') {
        code = renderResult;
      } else {
        code = renderResult.code;
        if (renderResult.map) {
          map = renderResult.map;
        }
      }
    }

    // Generate final code
    const generated = await generateCode(code, options);

    // Add to output
    if (chunk.type === 'chunk') {
      output.output.push({
        type: 'chunk',
        code: generated.code,
        map: options.sourcemap ? map : undefined,
        fileName: chunk.fileName,
        name: chunk.name,
        facadeModuleId: chunk.facadeModuleId,
        isDynamicEntry: chunk.isDynamicEntry || false,
        isEntry: chunk.isEntry || false,
        isImplicitEntry: false,
        imports: chunk.imports || [],
        dynamicImports: chunk.dynamicImports || [],
        modules: chunk.modules || {},
        exports: chunk.exports || [],
        moduleIds: Object.keys(chunk.modules || {}),
      });
    }
  }

  // Run generateBundle hook
  const bundle: any = {};
  for (const chunk of output.output) {
    bundle[chunk.fileName] = chunk;
  }

  await pluginDriver.hookParallel('generateBundle', options, bundle);

  // Add emitted assets
  const emittedFiles = pluginDriver.getEmittedFiles();
  for (const file of emittedFiles) {
    if (file.type === 'asset') {
      output.output.push({
        type: 'asset',
        fileName: file.fileName!,
        source: file.source!,
        name: file.name,
      });
    }
  }

  // Run renderEnd hook
  await pluginDriver.hookParallel('renderEnd', options, {});

  return output;
}

/**
 * Normalize input options
 */
function normalizeInputOptions(options: InputOptions): InputOptions {
  return {
    input: options.input,
    external: options.external || [],
    plugins: options.plugins || [],
    root: options.root || process.cwd(),
    treeshake: options.treeshake !== false ? {
      moduleSideEffects: true,
      propertyReadSideEffects: true,
      tryCatchDeoptimization: true,
      unknownGlobalSideEffects: true,
      ...normalizeTreeShakeOptions(options.treeshake),
    } : false,
    cache: options.cache,
    onwarn: options.onwarn || ((warning) => console.warn(warning)),
    perf: options.perf || false,
    strictDeprecations: options.strictDeprecations || false,
    acorn: options.acorn,
    acornInjectPlugins: options.acornInjectPlugins,
    context: options.context || 'undefined',
    moduleContext: options.moduleContext,
    preserveEntrySignatures: options.preserveEntrySignatures || 'strict',
    shimMissingExports: options.shimMissingExports || false,
    maxParallelFileReads: options.maxParallelFileReads || 20,
  };
}

/**
 * Normalize tree shake options
 */
function normalizeTreeShakeOptions(treeshake: any): any {
  if (treeshake === true || treeshake === undefined) {
    return {};
  }

  if (typeof treeshake === 'object') {
    return treeshake;
  }

  return {};
}

/**
 * Normalize output options
 */
function normalizeOutputOptions(options: OutputOptions): OutputOptions {
  const format = options.format || 'esm';

  return {
    format,
    dir: options.dir,
    file: options.file,
    name: options.name,
    globals: options.globals || {},
    entryFileNames: options.entryFileNames || '[name].js',
    chunkFileNames: options.chunkFileNames || '[name]-[hash].js',
    assetFileNames: options.assetFileNames || 'assets/[name]-[hash][extname]',
    sourcemap: options.sourcemap || false,
    sourcemapExcludeSources: options.sourcemapExcludeSources || false,
    sourcemapFile: options.sourcemapFile,
    sourcemapPathTransform: options.sourcemapPathTransform,
    banner: options.banner,
    footer: options.footer,
    intro: options.intro,
    outro: options.outro,
    compact: options.compact || false,
    minifyInternalExports: options.minifyInternalExports !== false,
    generatedCode: {
      arrowFunctions: true,
      constBindings: true,
      objectShorthand: true,
      reservedNamesAsProps: true,
      symbols: false,
      ...options.generatedCode,
    },
    interop: options.interop || 'auto',
    esModule: options.esModule !== false,
    exports: options.exports || 'auto',
    freeze: options.freeze !== false,
    indent: options.indent !== false,
    namespaceToStringTag: options.namespaceToStringTag || false,
    preferConst: options.preferConst || false,
    strict: options.strict !== false,
    systemNullSetters: options.systemNullSetters || false,
    manualChunks: options.manualChunks,
    preserveModules: options.preserveModules || false,
    preserveModulesRoot: options.preserveModulesRoot,
    validate: options.validate || false,
    externalLiveBindings: options.externalLiveBindings !== false,
    inlineDynamicImports: options.inlineDynamicImports || false,
  };
}

/**
 * Normalize input to entries map
 */
function normalizeInput(input: string | string[] | Record<string, string>): Record<string, string> {
  if (typeof input === 'string') {
    return { main: input };
  }

  if (Array.isArray(input)) {
    const entries: Record<string, string> = {};
    for (const file of input) {
      const name = basename(file, extname(file));
      entries[name] = file;
    }
    return entries;
  }

  return input;
}

/**
 * Create cache from module graph
 */
function createCache(moduleGraph: ModuleGraph): RollupCache {
  return {
    modules: moduleGraph.getCacheModules(),
  };
}

/**
 * Watch for file changes
 */
export function watch(configs: InputOptions | InputOptions[]): RollupWatcher {
  const configArray = Array.isArray(configs) ? configs : [configs];

  let running = true;
  const watchers: Map<string, any> = new Map();

  const watcher: RollupWatcher = {
    on(event: string, handler: (...args: any[]) => void) {
      // Simplified event handling
      if (event === 'event') {
        // Start initial build
        handler({ code: 'START' });

        buildAll()
          .then(() => {
            handler({ code: 'BUNDLE_END' });
          })
          .catch((error) => {
            handler({ code: 'ERROR', error });
          });
      }

      return this;
    },

    close() {
      running = false;
      for (const watcher of watchers.values()) {
        // Close file watchers
      }
    },
  };

  async function buildAll() {
    for (const config of configArray) {
      const bundle = await rollup(config);
      if (config.output) {
        if (Array.isArray(config.output)) {
          for (const output of config.output) {
            await bundle.write(output);
          }
        } else {
          await bundle.write(config.output);
        }
      }
      await bundle.close();
    }
  }

  return watcher;
}

/**
 * Rollup watcher interface
 */
export interface RollupWatcher {
  on(event: 'event', handler: (event: RollupWatcherEvent) => void): this;
  close(): void;
}

/**
 * Watcher event
 */
export interface RollupWatcherEvent {
  code: 'START' | 'BUNDLE_START' | 'BUNDLE_END' | 'END' | 'ERROR';
  error?: Error;
  input?: string;
  output?: string[];
  duration?: number;
}
