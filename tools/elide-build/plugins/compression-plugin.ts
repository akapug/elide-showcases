/**
 * Compression Plugin
 *
 * Generate compressed versions of assets
 */

import * as fs from "fs";
import * as zlib from "zlib";
import { promisify } from "util";
import { Plugin } from "./index";

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

export interface CompressionPluginOptions {
  algorithm?: "gzip" | "brotli" | "both";
  threshold?: number;
  deleteOriginal?: boolean;
}

export function compressionPlugin(options: CompressionPluginOptions = {}): Plugin {
  return {
    name: "compression-plugin",

    async setup(build) {
      build.onEnd(async (result) => {
        if (!result.outputFiles) return;

        for (const file of result.outputFiles) {
          const threshold = options.threshold || 1024;

          if (file.size < threshold) continue;

          const algorithm = options.algorithm || "gzip";

          if (algorithm === "gzip" || algorithm === "both") {
            const compressed = await gzip(file.contents);
            fs.writeFileSync(file.path + ".gz", compressed);
          }

          if (algorithm === "brotli" || algorithm === "both") {
            const compressed = await brotliCompress(file.contents);
            fs.writeFileSync(file.path + ".br", compressed);
          }

          if (options.deleteOriginal) {
            fs.unlinkSync(file.path);
          }
        }
      });
    },
  };
}
