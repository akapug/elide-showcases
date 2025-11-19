/**
 * Image Plugin
 *
 * Optimize and process images
 */

import * as fs from "fs";
import { Plugin } from "./index";

export interface ImagePluginOptions {
  optimize?: boolean;
  inline?: boolean | number;
  formats?: string[];
}

export function imagePlugin(options: ImagePluginOptions = {}): Plugin {
  return {
    name: "image-plugin",

    async setup(build) {
      build.onLoad({ filter: /\.(png|jpg|jpeg|gif|svg|webp)$/ }, async (args) => {
        const contents = fs.readFileSync(args.path);

        // Check if should inline
        const shouldInline =
          typeof options.inline === "boolean"
            ? options.inline
            : contents.length <= (options.inline || 8192);

        if (shouldInline) {
          const base64 = contents.toString("base64");
          const ext = args.path.split(".").pop();
          const mimeType = `image/${ext}`;
          const dataURL = `data:${mimeType};base64,${base64}`;

          return {
            contents: `export default ${JSON.stringify(dataURL)};`,
            loader: "js",
          };
        }

        return { contents, loader: "file" };
      });
    },
  };
}
