/**
 * Asset Processor
 *
 * Processes and optimizes assets:
 * - Images (PNG, JPG, WebP, SVG)
 * - Fonts (WOFF, WOFF2, TTF)
 * - CSS/SCSS/Less
 * - JSON and other data files
 */

export interface AssetOptions {
  optimize?: boolean;
  inline?: boolean | number; // true or max size in bytes
  publicPath?: string;
  outputPath?: string;
  hash?: boolean;
  hashLength?: number;
}

export interface ProcessedAsset {
  type: string;
  path: string;
  size: number;
  optimizedSize?: number;
  hash: string;
  inline: boolean;
  data?: string | Buffer;
  url?: string;
}

export class AssetProcessor {
  private options: Required<AssetOptions>;
  private processedAssets: Map<string, ProcessedAsset> = new Map();

  constructor(options: AssetOptions = {}) {
    this.options = {
      optimize: options.optimize ?? true,
      inline: options.inline ?? 8192, // 8 KB default
      publicPath: options.publicPath || "/assets/",
      outputPath: options.outputPath || "dist/assets",
      hash: options.hash ?? true,
      hashLength: options.hashLength || 8,
    };
  }

  /**
   * Process an asset file
   */
  async process(filePath: string, content: Buffer): Promise<ProcessedAsset> {
    const type = this.getAssetType(filePath);
    const originalSize = content.length;
    let processedContent = content;
    let optimizedSize = originalSize;

    // Check if we should inline
    const shouldInline = this.shouldInline(content);

    // Optimize based on type
    if (this.options.optimize && !shouldInline) {
      switch (type) {
        case "image":
          processedContent = await this.optimizeImage(filePath, content);
          break;
        case "css":
          processedContent = await this.optimizeCSS(content);
          break;
        case "font":
          processedContent = await this.optimizeFont(filePath, content);
          break;
        case "json":
          processedContent = await this.optimizeJSON(content);
          break;
      }

      optimizedSize = processedContent.length;
    }

    // Generate hash
    const hash = this.generateHash(processedContent);

    // Generate URL
    const url = this.generateURL(filePath, hash);

    const asset: ProcessedAsset = {
      type,
      path: filePath,
      size: originalSize,
      optimizedSize,
      hash,
      inline: shouldInline,
      url,
    };

    if (shouldInline) {
      asset.data = this.encodeInline(processedContent, type);
    } else {
      asset.data = processedContent;
    }

    this.processedAssets.set(filePath, asset);

    return asset;
  }

  /**
   * Check if asset should be inlined
   */
  private shouldInline(content: Buffer): boolean {
    if (typeof this.options.inline === "boolean") {
      return this.options.inline;
    }

    return content.length <= this.options.inline;
  }

  /**
   * Get asset type from file path
   */
  private getAssetType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();

    const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"];
    const fontExts = ["woff", "woff2", "ttf", "eot", "otf"];
    const cssExts = ["css", "scss", "sass", "less"];

    if (imageExts.includes(ext || "")) return "image";
    if (fontExts.includes(ext || "")) return "font";
    if (cssExts.includes(ext || "")) return "css";
    if (ext === "json") return "json";

    return "other";
  }

  /**
   * Optimize image
   */
  private async optimizeImage(filePath: string, content: Buffer): Promise<Buffer> {
    // In a real implementation, this would use image optimization libraries
    // like sharp, imagemin, etc.

    const ext = filePath.split(".").pop()?.toLowerCase();

    if (ext === "svg") {
      return this.optimizeSVG(content);
    }

    // For other images, return as-is
    // In production, you'd use sharp or similar:
    // const sharp = require('sharp');
    // return await sharp(content)
    //   .resize({ width: 1920, withoutEnlargement: true })
    //   .jpeg({ quality: 80 })
    //   .toBuffer();

    return content;
  }

  /**
   * Optimize SVG
   */
  private optimizeSVG(content: Buffer): Buffer {
    let svg = content.toString("utf-8");

    // Remove comments
    svg = svg.replace(/<!--[\s\S]*?-->/g, "");

    // Remove unnecessary whitespace
    svg = svg.replace(/\s+/g, " ");

    // Remove default attributes
    svg = svg.replace(/\s(fill|stroke)="none"/g, "");

    // Minify path data
    svg = svg.replace(/\s+([MmLlHhVvCcSsQqTtAaZz])/g, "$1");
    svg = svg.replace(/([MmLlHhVvCcSsQqTtAaZz])\s+/g, "$1");

    return Buffer.from(svg, "utf-8");
  }

  /**
   * Optimize CSS
   */
  private async optimizeCSS(content: Buffer): Promise<Buffer> {
    let css = content.toString("utf-8");

    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, "");

    // Remove unnecessary whitespace
    css = css.replace(/\s+/g, " ");
    css = css.replace(/\s*([{}:;,])\s*/g, "$1");

    // Remove trailing semicolons
    css = css.replace(/;}/g, "}");

    // Remove unnecessary zeros
    css = css.replace(/0\.(\d+)/g, ".$1");
    css = css.replace(/:0px/g, ":0");

    // Shorten colors
    css = css.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, "#$1$2$3");

    return Buffer.from(css, "utf-8");
  }

  /**
   * Optimize font
   */
  private async optimizeFont(filePath: string, content: Buffer): Promise<Buffer> {
    // Font optimization would typically involve subsetting
    // For now, return as-is
    return content;
  }

  /**
   * Optimize JSON
   */
  private async optimizeJSON(content: Buffer): Promise<Buffer> {
    try {
      const json = JSON.parse(content.toString("utf-8"));
      const minified = JSON.stringify(json);
      return Buffer.from(minified, "utf-8");
    } catch {
      return content;
    }
  }

  /**
   * Encode asset for inlining
   */
  private encodeInline(content: Buffer, type: string): string {
    if (type === "image") {
      const ext = this.getImageMimeType(content);
      const base64 = content.toString("base64");
      return `data:${ext};base64,${base64}`;
    }

    if (type === "font") {
      const base64 = content.toString("base64");
      return `data:font/woff2;base64,${base64}`;
    }

    if (type === "css") {
      return content.toString("utf-8");
    }

    if (type === "json") {
      return content.toString("utf-8");
    }

    return content.toString("base64");
  }

  /**
   * Get image MIME type from content
   */
  private getImageMimeType(content: Buffer): string {
    // Check magic numbers
    if (content[0] === 0xff && content[1] === 0xd8) {
      return "image/jpeg";
    }
    if (content[0] === 0x89 && content[1] === 0x50) {
      return "image/png";
    }
    if (content[0] === 0x47 && content[1] === 0x49) {
      return "image/gif";
    }
    if (content[0] === 0x52 && content[1] === 0x49) {
      return "image/webp";
    }
    if (content.toString("utf-8", 0, 5) === "<?xml" || content.toString("utf-8", 0, 4) === "<svg") {
      return "image/svg+xml";
    }

    return "image/png"; // Default
  }

  /**
   * Generate hash for content
   */
  private generateHash(content: Buffer): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash)
      .toString(16)
      .substring(0, this.options.hashLength);
  }

  /**
   * Generate URL for asset
   */
  private generateURL(filePath: string, hash: string): string {
    const filename = filePath.split("/").pop() || "asset";
    const ext = filename.split(".").pop();
    const name = filename.replace(`.${ext}`, "");

    if (this.options.hash) {
      return `${this.options.publicPath}${name}.${hash}.${ext}`;
    }

    return `${this.options.publicPath}${filename}`;
  }

  /**
   * Get processed asset
   */
  getAsset(filePath: string): ProcessedAsset | undefined {
    return this.processedAssets.get(filePath);
  }

  /**
   * Get all processed assets
   */
  getAllAssets(): ProcessedAsset[] {
    return Array.from(this.processedAssets.values());
  }

  /**
   * Generate CSS for fonts
   */
  generateFontFace(fontAssets: ProcessedAsset[]): string {
    let css = "";

    for (const asset of fontAssets) {
      const filename = asset.path.split("/").pop() || "";
      const fontFamily = filename.split(".")[0];

      css += `
@font-face {
  font-family: '${fontFamily}';
  src: url('${asset.url || asset.data}') format('woff2');
  font-display: swap;
}
      `.trim() + "\n\n";
    }

    return css;
  }

  /**
   * Generate manifest of all assets
   */
  generateManifest(): Record<string, string> {
    const manifest: Record<string, string> = {};

    for (const [path, asset] of this.processedAssets) {
      if (!asset.inline && asset.url) {
        manifest[path] = asset.url;
      }
    }

    return manifest;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    inlined: number;
    optimized: number;
    originalSize: number;
    optimizedSize: number;
    savings: number;
  } {
    const assets = this.getAllAssets();
    const total = assets.length;
    const inlined = assets.filter((a) => a.inline).length;
    const optimized = assets.filter((a) => a.optimizedSize !== undefined).length;

    const originalSize = assets.reduce((sum, a) => sum + a.size, 0);
    const optimizedSize = assets.reduce((sum, a) => sum + (a.optimizedSize || a.size), 0);
    const savings = originalSize - optimizedSize;

    return {
      total,
      inlined,
      optimized,
      originalSize,
      optimizedSize,
      savings,
    };
  }

  /**
   * Clear processed assets
   */
  clear(): void {
    this.processedAssets.clear();
  }
}
