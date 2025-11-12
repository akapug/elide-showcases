/**
 * Copy Plugin
 *
 * Copy static files to output directory
 */

import * as fs from "fs";
import * as path from "path";
import { Plugin } from "./index";

export interface CopyPluginOptions {
  patterns: Array<{
    from: string;
    to?: string;
    ignore?: string[];
  }>;
}

export function copyPlugin(options: CopyPluginOptions): Plugin {
  return {
    name: "copy-plugin",

    async setup(build) {
      build.onEnd(async (result) => {
        for (const pattern of options.patterns) {
          const outDir = result.outputFiles?.[0]
            ? path.dirname(result.outputFiles[0].path)
            : "dist";

          const toPath = pattern.to ? path.join(outDir, pattern.to) : outDir;

          if (!fs.existsSync(toPath)) {
            fs.mkdirSync(toPath, { recursive: true });
          }

          if (fs.statSync(pattern.from).isDirectory()) {
            this.copyDir(pattern.from, toPath, pattern.ignore);
          } else {
            fs.copyFileSync(pattern.from, path.join(toPath, path.basename(pattern.from)));
          }
        }
      });
    },

    copyDir(src: string, dest: string, ignore?: string[]): void {
      const entries = fs.readdirSync(src);

      for (const entry of entries) {
        if (ignore?.some((pattern) => entry.includes(pattern))) continue;

        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);

        if (fs.statSync(srcPath).isDirectory()) {
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          this.copyDir(srcPath, destPath, ignore);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    },
  };
}
