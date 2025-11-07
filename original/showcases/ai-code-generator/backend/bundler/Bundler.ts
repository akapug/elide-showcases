/**
 * Code Bundler
 *
 * Simple bundler for combining and optimizing code
 * Features: minification, tree shaking (basic), module resolution
 */

import { logger } from '../utils/logger';
import { Minifier } from './Minifier';

export interface BundleOptions {
  code: string;
  files: Array<{ path: string; content: string }>;
  language: string;
  framework?: string;
  minify?: boolean;
  sourceMap?: boolean;
}

export interface BundleResult {
  code: string;
  files: Array<{ path: string; content: string }>;
  sourceMap?: string;
  size: number;
  originalSize: number;
}

export class Bundler {
  private minifier: Minifier;

  constructor() {
    this.minifier = new Minifier();
  }

  /**
   * Bundle code and files
   */
  async bundle(options: BundleOptions): Promise<BundleResult> {
    logger.info(`Bundling ${options.language} code`);

    const startTime = Date.now();
    let bundledCode = options.code;
    const bundledFiles = [...options.files];

    // Combine files if needed
    if (options.files.length > 0) {
      bundledCode = this.combineFiles(options.code, options.files);
    }

    // Resolve imports/requires
    bundledCode = this.resolveImports(bundledCode, options.files);

    // Minify if requested
    const originalSize = this.calculateSize(bundledCode);
    if (options.minify) {
      bundledCode = await this.minifier.minify(bundledCode, options.language);
    }

    const size = this.calculateSize(bundledCode);
    const duration = Date.now() - startTime;

    logger.info(`Bundling completed in ${duration}ms. Size: ${originalSize} -> ${size} bytes`);

    return {
      code: bundledCode,
      files: bundledFiles,
      sourceMap: options.sourceMap ? this.generateSourceMap(options.code, bundledCode) : undefined,
      size,
      originalSize,
    };
  }

  /**
   * Combine multiple files into one
   */
  private combineFiles(mainCode: string, files: Array<{ path: string; content: string }>): string {
    let combined = mainCode;

    for (const file of files) {
      // Add file separator comment
      combined += `\n\n// File: ${file.path}\n`;
      combined += file.content;
    }

    return combined;
  }

  /**
   * Resolve import/require statements
   */
  private resolveImports(code: string, files: Array<{ path: string; content: string }>): string {
    let resolved = code;

    // Find all import statements
    const importRegex = /import\s+.*?\s+from\s+['"](\.[^'"]+)['"]/g;
    const matches = code.matchAll(importRegex);

    for (const match of matches) {
      const importPath = match[1];
      const file = files.find(f => f.path.includes(importPath));

      if (file) {
        // Inline the imported file
        resolved = resolved.replace(match[0], `\n// Inlined: ${file.path}\n${file.content}\n`);
      }
    }

    // Find all require statements
    const requireRegex = /require\(['"](\.[^'"]+)['"]\)/g;
    const requireMatches = code.matchAll(requireRegex);

    for (const match of requireMatches) {
      const requirePath = match[1];
      const file = files.find(f => f.path.includes(requirePath));

      if (file) {
        // Inline the required file
        resolved = resolved.replace(match[0], `(function() { ${file.content} })()`);
      }
    }

    return resolved;
  }

  /**
   * Generate source map
   */
  private generateSourceMap(original: string, bundled: string): string {
    // Simplified source map
    return JSON.stringify({
      version: 3,
      sources: ['original.js'],
      names: [],
      mappings: '',
      sourcesContent: [original],
    });
  }

  /**
   * Calculate code size in bytes
   */
  private calculateSize(code: string): number {
    return new Blob([code]).size;
  }
}
