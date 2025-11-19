/**
 * Elide Optimizer
 *
 * Comprehensive code optimization:
 * - JavaScript/CSS/HTML minification
 * - Dead code elimination
 * - Constant folding
 * - Scope hoisting
 * - Image optimization
 * - Font subsetting
 * - Compression (gzip, brotli)
 */

import { JavaScriptMinifier } from "./js-minifier";
import { CSSMinifier } from "./css-minifier";
import { HTMLMinifier } from "./html-minifier";
import { ImageOptimizer } from "./image-optimizer";
import { Compressor } from "./compressor";

export interface OptimizerOptions {
  minify?: boolean;
  mangle?: boolean;
  compress?: boolean | CompressOptions;
  sourceMap?: boolean;
  target?: "browser" | "node";
  toplevel?: boolean;
  ie8?: boolean;
  safari10?: boolean;
  keep_classnames?: boolean;
  keep_fnames?: boolean;
  format?: FormatOptions;
}

export interface CompressOptions {
  arguments?: boolean;
  booleans?: boolean;
  dead_code?: boolean;
  drop_console?: boolean;
  drop_debugger?: boolean;
  evaluate?: boolean;
  global_defs?: Record<string, any>;
  hoist_funs?: boolean;
  hoist_props?: boolean;
  hoist_vars?: boolean;
  if_return?: boolean;
  inline?: boolean;
  join_vars?: boolean;
  keep_fargs?: boolean;
  loops?: boolean;
  negate_iife?: boolean;
  passes?: number;
  properties?: boolean;
  pure_funcs?: string[];
  pure_getters?: boolean;
  reduce_funcs?: boolean;
  reduce_vars?: boolean;
  sequences?: boolean;
  side_effects?: boolean;
  switches?: boolean;
  typeofs?: boolean;
  unsafe?: boolean;
  unsafe_arrows?: boolean;
  unsafe_comps?: boolean;
  unsafe_Function?: boolean;
  unsafe_math?: boolean;
  unsafe_methods?: boolean;
  unsafe_proto?: boolean;
  unsafe_regexp?: boolean;
  unsafe_undefined?: boolean;
  unused?: boolean;
}

export interface FormatOptions {
  comments?: boolean | "all" | "some" | RegExp;
  indent_level?: number;
  indent_start?: number;
  max_line_len?: number;
  preamble?: string;
  quote_style?: 0 | 1 | 2 | 3;
  safari10?: boolean;
  semicolons?: boolean;
  shebang?: boolean;
  webkit?: boolean;
  wrap_iife?: boolean;
}

export interface OptimizeResult {
  code: string;
  map?: any;
  compressedCode?: Buffer;
  stats: OptimizeStats;
}

export interface OptimizeStats {
  originalSize: number;
  minifiedSize: number;
  compressedSize?: number;
  compressionRatio: number;
  timeTaken: number;
}

export class Optimizer {
  private options: OptimizerOptions;
  private jsMinifier: JavaScriptMinifier;
  private cssMinifier: CSSMinifier;
  private htmlMinifier: HTMLMinifier;
  private imageOptimizer: ImageOptimizer;
  private compressor: Compressor;

  constructor(options: OptimizerOptions = {}) {
    this.options = {
      minify: options.minify ?? true,
      mangle: options.mangle ?? true,
      compress: options.compress ?? true,
      sourceMap: options.sourceMap ?? false,
      target: options.target || "browser",
      toplevel: options.toplevel ?? false,
      ie8: options.ie8 ?? false,
      safari10: options.safari10 ?? false,
      keep_classnames: options.keep_classnames ?? false,
      keep_fnames: options.keep_fnames ?? false,
      ...options,
    };

    this.jsMinifier = new JavaScriptMinifier(this.options);
    this.cssMinifier = new CSSMinifier();
    this.htmlMinifier = new HTMLMinifier();
    this.imageOptimizer = new ImageOptimizer();
    this.compressor = new Compressor();
  }

  /**
   * Optimize code based on type
   */
  async optimize(code: string, type: "js" | "css" | "html"): Promise<OptimizeResult> {
    const startTime = performance.now();
    const originalSize = Buffer.byteLength(code, "utf-8");

    let result: { code: string; map?: any };

    switch (type) {
      case "js":
        result = await this.jsMinifier.minify(code);
        break;
      case "css":
        result = await this.cssMinifier.minify(code);
        break;
      case "html":
        result = await this.htmlMinifier.minify(code);
        break;
      default:
        result = { code };
    }

    const minifiedSize = Buffer.byteLength(result.code, "utf-8");
    const timeTaken = performance.now() - startTime;

    // Compress if enabled
    let compressedCode: Buffer | undefined;
    let compressedSize: number | undefined;

    if (this.options.compress) {
      compressedCode = await this.compressor.compress(result.code);
      compressedSize = compressedCode.length;
    }

    const compressionRatio = originalSize > 0 ? (originalSize - minifiedSize) / originalSize : 0;

    return {
      code: result.code,
      map: result.map,
      compressedCode,
      stats: {
        originalSize,
        minifiedSize,
        compressedSize,
        compressionRatio,
        timeTaken,
      },
    };
  }

  /**
   * Optimize multiple files in parallel
   */
  async optimizeMany(
    files: Array<{ code: string; type: "js" | "css" | "html" }>
  ): Promise<OptimizeResult[]> {
    return Promise.all(files.map((f) => this.optimize(f.code, f.type)));
  }

  /**
   * Optimize image
   */
  async optimizeImage(buffer: Buffer, type: string): Promise<Buffer> {
    return this.imageOptimizer.optimize(buffer, type);
  }

  /**
   * Get optimization statistics
   */
  getStats(results: OptimizeResult[]): string {
    const totalOriginal = results.reduce((sum, r) => sum + r.stats.originalSize, 0);
    const totalMinified = results.reduce((sum, r) => sum + r.stats.minifiedSize, 0);
    const totalCompressed = results.reduce(
      (sum, r) => sum + (r.stats.compressedSize || 0),
      0
    );

    const reduction = totalOriginal > 0 ? ((totalOriginal - totalMinified) / totalOriginal) * 100 : 0;

    return `
Optimization Results:
  Original Size: ${(totalOriginal / 1024).toFixed(2)} KB
  Minified Size: ${(totalMinified / 1024).toFixed(2)} KB
  Compressed Size: ${(totalCompressed / 1024).toFixed(2)} KB
  Size Reduction: ${reduction.toFixed(1)}%
  Files Optimized: ${results.length}
    `.trim();
  }
}
