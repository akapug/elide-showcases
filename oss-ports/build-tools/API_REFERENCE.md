# Build Tools - Complete API Reference

This document provides comprehensive API documentation for all build tools in this repository.

## Table of Contents

- [Vite Clone API](#vite-clone-api)
- [Rollup Clone API](#rollup-clone-api)
- [Parcel Clone API](#parcel-clone-api)
- [Turbopack Clone API](#turbopack-clone-api)
- [Webpack Clone API](#webpack-clone-api)

---

## Vite Clone API

### JavaScript API

#### `createServer(inlineConfig?: InlineConfig): Promise<ViteDevServer>`

Create a development server instance.

**Parameters**:
- `inlineConfig` (optional): Inline configuration object

**Returns**: Promise resolving to `ViteDevServer`

**Example**:
```javascript
import { createServer } from '@elide/vite-clone';

const server = await createServer({
  root: process.cwd(),
  server: {
    port: 3000
  }
});

await server.listen();
```

#### `build(inlineConfig?: InlineConfig): Promise<RollupOutput>`

Build for production.

**Parameters**:
- `inlineConfig` (optional): Inline configuration object

**Returns**: Promise resolving to `RollupOutput`

**Example**:
```javascript
import { build } from '@elide/vite-clone';

const output = await build({
  root: process.cwd(),
  build: {
    outDir: 'dist'
  }
});
```

#### `preview(inlineConfig?: InlineConfig): Promise<ViteDevServer>`

Preview production build.

**Parameters**:
- `inlineConfig` (optional): Inline configuration object

**Returns**: Promise resolving to preview server

**Example**:
```javascript
import { preview } from '@elide/vite-clone';

const server = await preview({
  preview: {
    port: 4173
  }
});

await server.listen();
```

### ViteDevServer Interface

#### Properties

- `config: ResolvedConfig` - Resolved configuration
- `middlewares: Connect.Server` - Connect middleware stack
- `httpServer: Server` - HTTP server instance
- `ws: WebSocketServer` - WebSocket server for HMR
- `moduleGraph: ModuleGraph` - Module dependency graph
- `pluginContainer: PluginContainer` - Plugin execution container

#### Methods

- `listen(port?: number, host?: string): Promise<void>` - Start server
- `close(): Promise<void>` - Close server
- `restart(): Promise<void>` - Restart server
- `transformRequest(url: string, options?: TransformOptions): Promise<TransformResult>` - Transform module
- `transformIndexHtml(url: string, html: string): Promise<string>` - Transform HTML

### Plugin API

#### Plugin Interface

```typescript
interface Plugin {
  name: string;
  enforce?: 'pre' | 'post';
  apply?: 'serve' | 'build' | ((config: UserConfig, env: ConfigEnv) => boolean);

  // Hooks
  config?(config: UserConfig, env: ConfigEnv): UserConfig | null | void;
  configResolved?(config: ResolvedConfig): void | Promise<void>;
  configureServer?(server: ViteDevServer): (() => void) | void;
  transformIndexHtml?(html: string, ctx: IndexHtmlTransformContext): IndexHtmlTransformResult;
  resolveId?(source: string, importer: string | undefined): string | null;
  load?(id: string): string | null;
  transform?(code: string, id: string): TransformResult | null;
  handleHotUpdate?(ctx: HmrContext): Array<ModuleNode> | void;
}
```

#### Plugin Hook Execution Order

1. `config` - Modify config before resolution
2. `configResolved` - After config is resolved
3. `configureServer` - Configure dev server (serve mode only)
4. `resolveId` - Resolve module IDs
5. `load` - Load module content
6. `transform` - Transform module content
7. `transformIndexHtml` - Transform HTML
8. `handleHotUpdate` - Custom HMR handling

### Configuration Types

#### UserConfig

```typescript
interface UserConfig {
  root?: string;
  base?: string;
  mode?: string;
  plugins?: PluginOption[];
  publicDir?: string | false;
  cacheDir?: string;
  resolve?: ResolveOptions;
  css?: CSSOptions;
  server?: ServerOptions;
  build?: BuildOptions;
  preview?: PreviewOptions;
  optimizeDeps?: DepOptimizationOptions;
}
```

#### ServerOptions

```typescript
interface ServerOptions {
  host?: string | boolean;
  port?: number;
  strictPort?: boolean;
  https?: boolean | HttpsOptions;
  open?: string | boolean;
  proxy?: Record<string, string | ProxyOptions>;
  cors?: boolean | CorsOptions;
  hmr?: boolean | HMROptions;
}
```

#### BuildOptions

```typescript
interface BuildOptions {
  target?: string | string[];
  outDir?: string;
  assetsDir?: string;
  assetsInlineLimit?: number;
  cssCodeSplit?: boolean;
  sourcemap?: boolean | 'inline' | 'hidden';
  rollupOptions?: RollupOptions;
  minify?: boolean | 'terser' | 'esbuild';
  write?: boolean;
  emptyOutDir?: boolean;
}
```

---

## Rollup Clone API

### JavaScript API

#### `rollup(inputOptions: InputOptions): Promise<RollupBuild>`

Create a bundle.

**Parameters**:
- `inputOptions`: Input configuration

**Returns**: Promise resolving to `RollupBuild`

**Example**:
```javascript
import { rollup } from '@elide/rollup-clone';

const bundle = await rollup({
  input: 'src/main.js',
  plugins: [/* ... */]
});
```

#### `watch(configs: InputOptions | InputOptions[]): RollupWatcher`

Watch for file changes.

**Parameters**:
- `configs`: Single config or array of configs

**Returns**: `RollupWatcher` instance

**Example**:
```javascript
import { watch } from '@elide/rollup-clone';

const watcher = watch({
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm'
  }
});

watcher.on('event', event => {
  if (event.code === 'BUNDLE_END') {
    console.log('Build complete');
  }
});
```

### RollupBuild Interface

#### Methods

- `generate(outputOptions: OutputOptions): Promise<RollupOutput>` - Generate output
- `write(outputOptions: OutputOptions): Promise<RollupOutput>` - Write output to disk
- `close(): Promise<void>` - Close bundle

### Plugin API

#### Plugin Interface

```typescript
interface Plugin {
  name: string;

  // Build hooks
  options?(options: InputOptions): InputOptions | null;
  buildStart?(options: InputOptions): void;
  resolveId?(source: string, importer: string | undefined): string | null;
  load?(id: string): string | null;
  transform?(code: string, id: string): TransformResult | null;
  moduleParsed?(moduleInfo: ModuleInfo): void;
  buildEnd?(error?: Error): void;

  // Output generation hooks
  renderStart?(outputOptions: OutputOptions, inputOptions: InputOptions): void;
  renderChunk?(code: string, chunk: RenderedChunk): string | null;
  generateBundle?(options: OutputOptions, bundle: OutputBundle): void;
  writeBundle?(options: OutputOptions, bundle: OutputBundle): void;
  closeBundle?(): void;
}
```

### Configuration Types

#### InputOptions

```typescript
interface InputOptions {
  input: string | string[] | Record<string, string>;
  external?: (string | RegExp)[] | ((id: string) => boolean);
  plugins?: Plugin[];
  treeshake?: TreeshakeOptions | false;
  cache?: RollupCache;
  onwarn?: (warning: RollupWarning) => void;
}
```

#### OutputOptions

```typescript
interface OutputOptions {
  format?: 'esm' | 'cjs' | 'umd' | 'iife' | 'system';
  dir?: string;
  file?: string;
  name?: string;
  globals?: Record<string, string> | ((id: string) => string);
  entryFileNames?: string;
  chunkFileNames?: string;
  assetFileNames?: string;
  sourcemap?: boolean | 'inline' | 'hidden';
  banner?: string | (() => string);
  footer?: string | (() => string);
  intro?: string | (() => string);
  outro?: string | (() => string);
}
```

#### TreeshakeOptions

```typescript
interface TreeshakeOptions {
  moduleSideEffects?: boolean | 'no-treeshake' | ((id: string) => boolean);
  propertyReadSideEffects?: boolean;
  tryCatchDeoptimization?: boolean;
  unknownGlobalSideEffects?: boolean;
}
```

---

## Parcel Clone API

### JavaScript API

#### `new Bundler(entry: string | string[], options?: BundlerOptions)`

Create a bundler instance.

**Parameters**:
- `entry`: Entry file(s)
- `options` (optional): Bundler options

**Example**:
```javascript
import Bundler from '@elide/parcel-clone';

const bundler = new Bundler('index.html', {
  outDir: './dist',
  watch: true,
  hmr: true
});

const bundle = await bundler.bundle();
```

### Bundler Class

#### Methods

- `bundle(): Promise<BundleResult>` - Build bundle
- `stop(): Promise<void>` - Stop bundler

#### Events

- `buildStart` - Build started
- `buildEnd` - Build completed
- `buildError` - Build error occurred

**Example**:
```javascript
bundler.on('buildStart', () => {
  console.log('Build started');
});

bundler.on('buildEnd', () => {
  console.log('Build completed');
});

bundler.on('buildError', (error) => {
  console.error('Build error:', error);
});
```

### Configuration Types

#### BundlerOptions

```typescript
interface BundlerOptions {
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
  hmr?: boolean | HMROptions;
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'verbose';
  autoInstall?: boolean;
}
```

### Plugin System

#### Transformer Plugin

```typescript
interface TransformerPlugin {
  async transform({ asset, options }): Promise<Asset[]> {
    // Transform asset
    const code = await asset.getCode();
    const transformed = transformCode(code);
    asset.setCode(transformed);
    return [asset];
  }
}
```

#### Resolver Plugin

```typescript
interface ResolverPlugin {
  async resolve({ specifier, dependency }): Promise<string | null> {
    // Resolve module
    return resolvedPath;
  }
}
```

#### Packager Plugin

```typescript
interface PackagerPlugin {
  async package({ bundle }): Promise<Package> {
    // Package bundle
    return {
      content: bundleCode,
      sourceMap: map
    };
  }
}
```

---

## Turbopack Clone API

### JavaScript API

#### `new Turbopack(options: TurbopackOptions)`

Create Turbopack instance.

**Parameters**:
- `options`: Turbopack configuration

**Example**:
```javascript
import { Turbopack } from '@elide/turbopack-clone';

const turbo = new Turbopack({
  entry: 'src/main.js',
  outdir: 'dist',
  dev: true
});

await turbo.build();
```

### Turbopack Class

#### Methods

- `build(): Promise<void>` - Build project
- `dev(): Promise<void>` - Start dev server
- `watch(): Promise<void>` - Watch mode

### Configuration Types

#### TurbopackOptions

```typescript
interface TurbopackOptions {
  entry: string | string[];
  outdir?: string;
  dev?: boolean;
  port?: number;
  cache?: boolean;
  cacheDir?: string;
}
```

---

## Webpack Clone API

### JavaScript API

#### `new Webpack(config: WebpackConfig)`

Create Webpack instance.

**Parameters**:
- `config`: Webpack configuration

**Example**:
```javascript
import Webpack from '@elide/webpack-clone';

const webpack = new Webpack({
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'bundle.js'
  }
});

const stats = await webpack.run();
```

### Webpack Class

#### Methods

- `run(): Promise<Stats>` - Run compilation
- `watch(watchOptions: WatchOptions, handler: (err, stats) => void): Watching` - Watch mode

#### Events

- `compile` - Compilation starting
- `done` - Compilation complete
- `failed` - Compilation failed

### Configuration Types

#### WebpackConfig

```typescript
interface WebpackConfig {
  entry: string | string[] | Record<string, string>;
  output?: OutputConfig;
  module?: ModuleConfig;
  plugins?: Plugin[];
  optimization?: OptimizationConfig;
  devServer?: DevServerConfig;
  mode?: 'development' | 'production';
  devtool?: string | false;
  resolve?: ResolveConfig;
}
```

#### ModuleConfig

```typescript
interface ModuleConfig {
  rules: Rule[];
}

interface Rule {
  test: RegExp;
  use: string | LoaderConfig | Array<string | LoaderConfig>;
  exclude?: RegExp;
  include?: RegExp;
  type?: string;
}
```

#### LoaderConfig

```typescript
interface LoaderConfig {
  loader: string;
  options?: any;
}
```

### Loader API

#### Loader Function

```typescript
type LoaderFunction = (
  this: LoaderContext,
  source: string,
  map?: any,
  meta?: any
) => string | void | Promise<string | void>;
```

#### LoaderContext

```typescript
interface LoaderContext {
  addDependency(file: string): void;
  callback(err: Error | null, content: string, sourceMap?: any, meta?: any): void;
  async(): (err: Error | null, content: string, sourceMap?: any, meta?: any) => void;
  emitFile(name: string, content: string | Buffer): void;
  emitWarning(warning: Error | string): void;
  emitError(error: Error | string): void;
  resolve(context: string, request: string, callback: (err: Error | null, result: string) => void): void;
  getOptions(): any;
  rootContext: string;
  context: string;
  resourcePath: string;
  resourceQuery: string;
}
```

### Plugin API

#### Plugin Class

```typescript
class Plugin {
  apply(compiler: Compiler): void {
    compiler.hooks.compile.tap('PluginName', params => {
      // Hook implementation
    });
  }
}
```

#### Compiler Hooks

- `compile` - Compilation starting
- `compilation` - Compilation created
- `emit` - Assets emitting
- `afterEmit` - Assets emitted
- `done` - Compilation complete
- `failed` - Compilation failed

#### Compilation Hooks

- `buildModule` - Module building
- `succeedModule` - Module built successfully
- `finishModules` - All modules built
- `optimize` - Optimization starting
- `optimizeChunks` - Chunks optimization
- `optimizeAssets` - Assets optimization

---

## Common Patterns

### Error Handling

```javascript
try {
  const result = await build(config);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
```

### Watch Mode

```javascript
const watcher = watch(config);

watcher.on('event', event => {
  if (event.code === 'ERROR') {
    console.error('Error:', event.error);
  }
});

// Stop watching
await watcher.close();
```

### Custom Plugins

```javascript
function myPlugin(options = {}) {
  return {
    name: 'my-plugin',

    transform(code, id) {
      if (id.endsWith('.custom')) {
        return transformCustom(code);
      }
    }
  };
}
```

### Custom Loaders

```javascript
module.exports = function(source) {
  const options = this.getOptions();

  // Transform source
  const result = transform(source, options);

  return result;
};
```

---

## TypeScript Support

All tools include comprehensive TypeScript definitions. Import types:

```typescript
import type {
  UserConfig,
  Plugin,
  ResolvedConfig
} from '@elide/vite-clone';

import type {
  InputOptions,
  OutputOptions,
  RollupBuild
} from '@elide/rollup-clone';

import type {
  BundlerOptions,
  BundleResult
} from '@elide/parcel-clone';

import type {
  TurbopackOptions
} from '@elide/turbopack-clone';

import type {
  WebpackConfig,
  Compiler,
  Stats
} from '@elide/webpack-clone';
```

---

## Migration Guides

See individual tool READMEs for detailed migration guides from original tools.

## Performance Tips

1. **Enable Caching**: All tools support persistent caching
2. **Optimize Dependencies**: Pre-bundle dependencies when possible
3. **Use Code Splitting**: Reduce initial bundle size
4. **Enable Source Maps**: Only in development
5. **Minimize Transformations**: Only transform what's necessary

## Debugging

### Enable Verbose Logging

```javascript
// Vite
const server = await createServer({
  logLevel: 'info'
});

// Rollup
const bundle = await rollup({
  onwarn: (warning) => console.warn(warning)
});

// Parcel
const bundler = new Bundler('index.html', {
  logLevel: 'verbose'
});
```

### Source Maps

Enable source maps for debugging:

```javascript
// All tools
{
  build: {
    sourcemap: true
  }
}
```

## Support

- GitHub Issues
- Documentation
- Discord Community
- Stack Overflow Tag: `elide-build-tools`

---

**Last Updated**: 2025-11-17
**Version**: 1.0.0
**Maintained By**: Elide Community
