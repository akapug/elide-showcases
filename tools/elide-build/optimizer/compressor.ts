/**
 * Compressor
 *
 * Compression utilities:
 * - Gzip compression
 * - Brotli compression
 * - Compression level control
 */

import * as zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

export interface CompressionOptions {
  level?: number;
  algorithm?: "gzip" | "brotli";
}

export class Compressor {
  /**
   * Compress data
   */
  async compress(
    data: string | Buffer,
    options: CompressionOptions = {}
  ): Promise<Buffer> {
    const input = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
    const algorithm = options.algorithm || "gzip";

    if (algorithm === "brotli") {
      return this.brotli(input, options.level);
    }

    return this.gzip(input, options.level);
  }

  /**
   * Gzip compression
   */
  private async gzip(data: Buffer, level?: number): Promise<Buffer> {
    const options = {
      level: level !== undefined ? level : zlib.constants.Z_BEST_COMPRESSION,
    };

    return gzip(data, options);
  }

  /**
   * Brotli compression
   */
  private async brotli(data: Buffer, level?: number): Promise<Buffer> {
    const options = {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]:
          level !== undefined ? level : zlib.constants.BROTLI_MAX_QUALITY,
      },
    };

    return brotliCompress(data, options);
  }

  /**
   * Get compression ratio
   */
  getCompressionRatio(original: number, compressed: number): number {
    return original > 0 ? (original - compressed) / original : 0;
  }
}
