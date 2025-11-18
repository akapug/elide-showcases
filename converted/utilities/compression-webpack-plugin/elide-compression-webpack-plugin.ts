/**
 * Compression Webpack Plugin - Asset Compression
 *
 * Prepare compressed versions of assets to serve them with Content-Encoding.
 * **POLYGLOT SHOWCASE**: Asset compression for ALL build systems on Elide!
 *
 * Based on https://www.npmjs.com/package/compression-webpack-plugin (~1M+ downloads/week)
 *
 * Features:
 * - Gzip and Brotli compression
 * - Configurable compression levels
 * - File filtering by size/pattern
 * - Async compression
 * - Multiple algorithms
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java build tools need compression
 * - ONE implementation works everywhere on Elide
 * - Consistent compression across languages
 * - Share compression configs across your stack
 *
 * Use cases:
 * - Webpack asset compression
 * - Build output optimization
 * - Static file preparation
 * - CDN deployment prep
 *
 * Package has ~1M+ downloads/week on npm - essential build optimization!
 */

import { createGzip, createBrotliCompress, constants } from 'node:zlib';
import { createReadStream, createWriteStream, statSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';

export interface CompressionOptions {
  algorithm?: 'gzip' | 'brotli';
  test?: RegExp;
  threshold?: number;
  minRatio?: number;
  deleteOriginalAssets?: boolean;
  compressionLevel?: number;
}

export class CompressionWebpackPlugin {
  private options: Required<CompressionOptions>;

  constructor(options: CompressionOptions = {}) {
    this.options = {
      algorithm: options.algorithm || 'gzip',
      test: options.test || /\.(js|css|html|svg)$/,
      threshold: options.threshold || 0,
      minRatio: options.minRatio || 0.8,
      deleteOriginalAssets: options.deleteOriginalAssets || false,
      compressionLevel: options.compressionLevel || 9,
    };
  }

  /**
   * Compress a single file
   */
  async compressFile(inputPath: string, outputPath: string): Promise<void> {
    const stats = statSync(inputPath);

    if (stats.size < this.options.threshold) {
      return;
    }

    const input = createReadStream(inputPath);
    const output = createWriteStream(outputPath);

    const compressor = this.options.algorithm === 'gzip'
      ? createGzip({ level: this.options.compressionLevel })
      : createBrotliCompress({
          params: {
            [constants.BROTLI_PARAM_QUALITY]: this.options.compressionLevel,
          },
        });

    await pipeline(input, compressor, output);

    const compressedStats = statSync(outputPath);
    const ratio = compressedStats.size / stats.size;

    if (ratio > this.options.minRatio) {
      // Compression not effective enough, remove compressed file
      const { unlinkSync } = await import('node:fs');
      unlinkSync(outputPath);
    }
  }

  /**
   * Should compress this file?
   */
  shouldCompress(filename: string): boolean {
    return this.options.test.test(filename);
  }

  /**
   * Get output filename
   */
  getOutputFilename(filename: string): string {
    const ext = this.options.algorithm === 'gzip' ? '.gz' : '.br';
    return filename + ext;
  }

  /**
   * Apply plugin (webpack-like interface)
   */
  apply(compiler: any): void {
    console.log(`Compression plugin (${this.options.algorithm}) applied`);
  }
}

/**
 * Simple compression utility functions
 */
export async function compressBuffer(
  buffer: Buffer,
  algorithm: 'gzip' | 'brotli' = 'gzip'
): Promise<Buffer> {
  const { promisify } = await import('node:util');
  const { gzip, brotliCompress } = await import('node:zlib');

  if (algorithm === 'gzip') {
    const gzipAsync = promisify(gzip);
    return await gzipAsync(buffer);
  } else {
    const brotliAsync = promisify(brotliCompress);
    return await brotliAsync(buffer);
  }
}

export async function compressString(
  input: string,
  algorithm: 'gzip' | 'brotli' = 'gzip'
): Promise<Buffer> {
  return compressBuffer(Buffer.from(input, 'utf-8'), algorithm);
}

export function calculateCompressionRatio(original: number, compressed: number): number {
  return compressed / original;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default CompressionWebpackPlugin;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🗜️  Compression Webpack Plugin - Asset Compression for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Plugin Usage ===");
  const plugin = new CompressionWebpackPlugin({
    algorithm: 'gzip',
    test: /\.(js|css)$/,
    threshold: 10240,
  });
  console.log("Plugin created with gzip compression");
  console.log("Test pattern:", /\.(js|css)$/);
  console.log("Threshold: 10KB");
  console.log();

  console.log("=== Example 2: Brotli Compression ===");
  const brotliPlugin = new CompressionWebpackPlugin({
    algorithm: 'brotli',
    test: /\.(js|css|html|svg)$/,
    compressionLevel: 11,
  });
  console.log("Brotli plugin with max compression (11)");
  console.log();

  console.log("=== Example 3: File Testing ===");
  const files = [
    'bundle.js',
    'styles.css',
    'image.png',
    'index.html',
    'data.json',
  ];

  console.log("Files to test:");
  files.forEach(file => {
    const shouldCompress = plugin.shouldCompress(file);
    const output = shouldCompress ? plugin.getOutputFilename(file) : 'skip';
    console.log(`  ${file} → ${output}`);
  });
  console.log();

  console.log("=== Example 4: Compress String ===");
  const text = "The quick brown fox jumps over the lazy dog. ".repeat(50);
  const originalSize = Buffer.from(text).length;

  compressString(text, 'gzip').then(gzipped => {
    const gzipRatio = calculateCompressionRatio(originalSize, gzipped.length);
    console.log("Original size:", formatBytes(originalSize));
    console.log("Gzipped size:", formatBytes(gzipped.length));
    console.log("Compression ratio:", (gzipRatio * 100).toFixed(1) + "%");
    console.log("Space saved:", formatBytes(originalSize - gzipped.length));
  });
  console.log();

  console.log("=== Example 5: Compress JSON ===");
  const jsonData = {
    users: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      active: i % 2 === 0,
    })),
  };

  const jsonString = JSON.stringify(jsonData);
  const jsonSize = Buffer.from(jsonString).length;

  compressString(jsonString, 'gzip').then(compressed => {
    const ratio = calculateCompressionRatio(jsonSize, compressed.length);
    console.log("JSON data size:", formatBytes(jsonSize));
    console.log("Compressed size:", formatBytes(compressed.length));
    console.log("Compression ratio:", (ratio * 100).toFixed(1) + "%");
    console.log("Savings:", ((1 - ratio) * 100).toFixed(1) + "%");
  });
  console.log();

  console.log("=== Example 6: Algorithm Comparison ===");
  const testData = "Lorem ipsum dolor sit amet. ".repeat(100);
  const testSize = Buffer.from(testData).length;

  Promise.all([
    compressString(testData, 'gzip'),
    compressString(testData, 'brotli'),
  ]).then(([gzipped, brotli]) => {
    console.log("Original:", formatBytes(testSize));
    console.log("Gzip:", formatBytes(gzipped.length),
                `(${(calculateCompressionRatio(testSize, gzipped.length) * 100).toFixed(1)}%)`);
    console.log("Brotli:", formatBytes(brotli.length),
                `(${(calculateCompressionRatio(testSize, brotli.length) * 100).toFixed(1)}%)`);

    const brotliBetter = brotli.length < gzipped.length;
    const diff = Math.abs(gzipped.length - brotli.length);
    console.log(`Brotli is ${brotliBetter ? 'better' : 'worse'} by ${formatBytes(diff)}`);
  });
  console.log();

  console.log("=== Example 7: Configuration Options ===");
  const configs = [
    { algorithm: 'gzip', compressionLevel: 6, desc: 'Balanced' },
    { algorithm: 'gzip', compressionLevel: 9, desc: 'Max compression' },
    { algorithm: 'brotli', compressionLevel: 11, desc: 'Best compression' },
  ];

  configs.forEach((config: any) => {
    const p = new CompressionWebpackPlugin(config);
    console.log(`${config.desc}:`, config.algorithm, `level ${config.compressionLevel}`);
  });
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same compression works in:");
  console.log("  • JavaScript/TypeScript builds");
  console.log("  • Python build tools (via Elide)");
  console.log("  • Ruby asset pipeline (via Elide)");
  console.log("  • Java build systems (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One compression tool, all languages");
  console.log("  ✓ Consistent compression across build systems");
  console.log("  ✓ Share compression configs");
  console.log("  ✓ Unified asset optimization");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Webpack asset compression");
  console.log("- Build output optimization");
  console.log("- Static file preparation for CDN");
  console.log("- Pre-compress for nginx/apache");
  console.log("- Reduce bundle sizes");
  console.log("- Faster page loads");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Async compression (non-blocking)");
  console.log("- Configurable compression levels");
  console.log("- Smart file filtering");
  console.log("- ~1M+ downloads/week on npm!");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in any build system via Elide");
  console.log("- Share compression configs across languages");
  console.log("- Consistent asset optimization everywhere");
  console.log("- Perfect for polyglot microservices!");
}
