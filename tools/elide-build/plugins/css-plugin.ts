/**
 * CSS Plugin
 *
 * Process and bundle CSS files
 */

import * as fs from "fs";
import { Plugin } from "./index";

export interface CSSPluginOptions {
  modules?: boolean;
  minify?: boolean;
  extract?: boolean;
}

export function cssPlugin(options: CSSPluginOptions = {}): Plugin {
  return {
    name: "css-plugin",

    async setup(build) {
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const contents = fs.readFileSync(args.path, "utf-8");

        if (options.extract) {
          // Extract to separate file
          return { contents, loader: "css" };
        }

        // Inject as JavaScript
        const code = `
const style = document.createElement('style');
style.textContent = ${JSON.stringify(contents)};
document.head.appendChild(style);
        `.trim();

        return { contents: code, loader: "js" };
      });
    },
  };
}
