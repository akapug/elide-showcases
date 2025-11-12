/**
 * Elide Compiler
 *
 * Universal compiler for multiple languages and transformations:
 * - TypeScript to JavaScript
 * - JSX/TSX to JavaScript
 * - Modern ES features to target ES version
 * - Python type hints
 * - Ruby syntax
 * - Custom transformations via plugins
 */

import { TypeScriptCompiler } from "./typescript";
import { JSXTransformer } from "./jsx";
import { ESTransformer } from "./es-transformer";
import { PythonCompiler } from "./python";
import { RubyCompiler } from "./ruby";

export interface CompilerOptions {
  target?: "es5" | "es2015" | "es2016" | "es2017" | "es2018" | "es2019" | "es2020" | "esnext";
  module?: "commonjs" | "esm" | "amd" | "umd" | "system";
  jsx?: "react" | "react-jsx" | "preserve";
  jsxFactory?: string;
  jsxFragment?: string;
  jsxImportSource?: string;
  strict?: boolean;
  sourceMap?: boolean;
  declaration?: boolean;
  declarationMap?: boolean;
  removeComments?: boolean;
  importHelpers?: boolean;
  downlevelIteration?: boolean;
  experimentalDecorators?: boolean;
  emitDecoratorMetadata?: boolean;
  lib?: string[];
  types?: string[];
  paths?: Record<string, string[]>;
  baseUrl?: string;
  rootDir?: string;
  outDir?: string;
  incremental?: boolean;
  tsBuildInfoFile?: string;
  watch?: boolean;
  plugins?: CompilerPlugin[];
}

export interface CompilerPlugin {
  name: string;
  transform(code: string, id: string): { code: string; map?: any } | null;
}

export interface CompileResult {
  code: string;
  map?: any;
  declarations?: string;
  declarationMap?: any;
  diagnostics: Diagnostic[];
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
}

export class Compiler {
  private options: CompilerOptions;
  private tsCompiler: TypeScriptCompiler;
  private jsxTransformer: JSXTransformer;
  private esTransformer: ESTransformer;
  private pythonCompiler: PythonCompiler;
  private rubyCompiler: RubyCompiler;
  private plugins: CompilerPlugin[];

  constructor(options: CompilerOptions = {}) {
    this.options = {
      target: options.target || "esnext",
      module: options.module || "esm",
      jsx: options.jsx || "react",
      jsxFactory: options.jsxFactory || "React.createElement",
      jsxFragment: options.jsxFragment || "React.Fragment",
      jsxImportSource: options.jsxImportSource,
      strict: options.strict ?? true,
      sourceMap: options.sourceMap ?? true,
      declaration: options.declaration ?? false,
      declarationMap: options.declarationMap ?? false,
      removeComments: options.removeComments ?? false,
      importHelpers: options.importHelpers ?? false,
      downlevelIteration: options.downlevelIteration ?? false,
      experimentalDecorators: options.experimentalDecorators ?? false,
      emitDecoratorMetadata: options.emitDecoratorMetadata ?? false,
      ...options,
    };

    this.plugins = options.plugins || [];

    this.tsCompiler = new TypeScriptCompiler(this.options);
    this.jsxTransformer = new JSXTransformer({
      runtime: this.options.jsx === "react-jsx" ? "automatic" : "classic",
      pragma: this.options.jsxFactory,
      pragmaFrag: this.options.jsxFragment,
      importSource: this.options.jsxImportSource,
    });
    this.esTransformer = new ESTransformer({
      target: this.options.target,
    });
    this.pythonCompiler = new PythonCompiler();
    this.rubyCompiler = new RubyCompiler();
  }

  /**
   * Compile code based on file type
   */
  async compile(code: string, filename: string): Promise<CompileResult> {
    const ext = filename.split(".").pop()?.toLowerCase();

    let result: CompileResult;

    switch (ext) {
      case "ts":
        result = await this.tsCompiler.compile(code, filename);
        break;

      case "tsx":
        result = await this.tsCompiler.compile(code, filename);
        result = await this.jsxTransformer.transform(result.code, filename);
        break;

      case "jsx":
        result = await this.jsxTransformer.transform(code, filename);
        break;

      case "js":
      case "mjs":
      case "cjs":
        result = await this.esTransformer.transform(code, filename);
        break;

      case "py":
        result = await this.pythonCompiler.compile(code, filename);
        break;

      case "rb":
        result = await this.rubyCompiler.compile(code, filename);
        break;

      default:
        result = {
          code,
          diagnostics: [],
        };
    }

    // Apply plugins
    for (const plugin of this.plugins) {
      const pluginResult = plugin.transform(result.code, filename);
      if (pluginResult) {
        result.code = pluginResult.code;
        if (pluginResult.map) {
          result.map = pluginResult.map;
        }
      }
    }

    return result;
  }

  /**
   * Compile multiple files in parallel
   */
  async compileMany(files: Array<{ code: string; filename: string }>): Promise<CompileResult[]> {
    return Promise.all(files.map((f) => this.compile(f.code, f.filename)));
  }

  /**
   * Get compiler diagnostics
   */
  getDiagnostics(): Diagnostic[] {
    return [
      ...this.tsCompiler.getDiagnostics(),
      ...this.jsxTransformer.getDiagnostics(),
      ...this.esTransformer.getDiagnostics(),
    ];
  }

  /**
   * Clear compiler caches
   */
  clear(): void {
    this.tsCompiler.clear();
    this.jsxTransformer.clear();
    this.esTransformer.clear();
  }
}
