/**
 * HTML Plugin
 *
 * Generate HTML files with automatic asset injection
 */

import * as fs from "fs";
import * as path from "path";
import { Plugin } from "./index";

export interface HTMLPluginOptions {
  template?: string;
  filename?: string;
  title?: string;
  meta?: Record<string, string>;
  inject?: boolean;
  minify?: boolean;
}

export function htmlPlugin(options: HTMLPluginOptions = {}): Plugin {
  return {
    name: "html-plugin",

    async setup(build) {
      build.onEnd(async (result) => {
        const template = options.template || this.getDefaultTemplate();
        let html = template;

        // Read template if it's a file
        if (fs.existsSync(template)) {
          html = fs.readFileSync(template, "utf-8");
        }

        // Inject title
        if (options.title) {
          html = html.replace(/<title>.*?<\/title>/, `<title>${options.title}</title>`);
        }

        // Inject meta tags
        if (options.meta) {
          let metaTags = "";
          for (const [name, content] of Object.entries(options.meta)) {
            metaTags += `<meta name="${name}" content="${content}">\n`;
          }
          html = html.replace("</head>", `${metaTags}</head>`);
        }

        // Inject assets
        if (options.inject !== false && result.outputFiles) {
          const scripts = result.outputFiles
            .filter((f: any) => f.path.endsWith(".js"))
            .map((f: any) => `<script src="${path.basename(f.path)}"></script>`)
            .join("\n");

          const styles = result.outputFiles
            .filter((f: any) => f.path.endsWith(".css"))
            .map((f: any) => `<link rel="stylesheet" href="${path.basename(f.path)}">`)
            .join("\n");

          html = html.replace("</head>", `${styles}\n</head>`);
          html = html.replace("</body>", `${scripts}\n</body>`);
        }

        // Minify if requested
        if (options.minify) {
          html = html.replace(/\s+/g, " ").replace(/>\s+</g, "><");
        }

        // Write HTML file
        const filename = options.filename || "index.html";
        const outDir = result.outputFiles?.[0]
          ? path.dirname(result.outputFiles[0].path)
          : "dist";
        const outputPath = path.join(outDir, filename);

        fs.writeFileSync(outputPath, html);
      });
    },

    getDefaultTemplate(): string {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elide App</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
      `.trim();
    },
  };
}
