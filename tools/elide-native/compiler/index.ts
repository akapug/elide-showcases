/**
 * Elide Native Compiler - Main Export
 */

export {
  NativeCompiler,
  CompilerOptions,
  AppMetadata,
  CompilationResult,
  CompilationStats,
  ModuleStats,
  AssetStats,
  OptimizationOptions,
  compileToNative,
  compileDesktopApp,
  compileMobileApp,
  compileCLI,
} from './aot';
export {
  Bundler,
  BundleOptions,
  TreeshakeOptions,
  Plugin,
  BundleResult,
  ModuleInfo,
  bundle,
} from './bundler';
