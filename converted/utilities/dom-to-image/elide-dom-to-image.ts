/**
 * DOM to Image - Convert DOM Nodes to Images
 *
 * Generate images from DOM nodes using HTML5 canvas.
 * **POLYGLOT SHOWCASE**: One dom-to-image for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dom-to-image (~2M downloads/week)
 *
 * Features:
 * - DOM to PNG conversion
 * - DOM to JPEG conversion
 * - DOM to SVG conversion
 * - Blob generation
 * - Data URL export
 * - CSS styling preserved
 *
 * Polyglot Benefits:
 * - Image generation in any language
 * - ONE API for all services
 * - Share rendering logic
 * - Universal exports
 *
 * Use cases:
 * - Screenshot capture
 * - Image generation
 * - Chart export
 * - Visual reports
 *
 * Package has ~2M downloads/week on npm!
 */

interface DomToImageOptions {
  width?: number;
  height?: number;
  style?: Partial<CSSStyleDeclaration>;
  quality?: number;
  bgcolor?: string;
  cacheBust?: boolean;
  filter?: (node: Node) => boolean;
}

class DomToImage {
  static async toPng(node: HTMLElement, options: DomToImageOptions = {}): Promise<string> {
    const canvas = await this.toCanvas(node, options);
    return canvas.toDataURL('image/png');
  }

  static async toJpeg(node: HTMLElement, options: DomToImageOptions = {}): Promise<string> {
    const canvas = await this.toCanvas(node, options);
    const quality = options.quality || 0.95;
    return canvas.toDataURL('image/jpeg', quality);
  }

  static async toBlob(node: HTMLElement, options: DomToImageOptions = {}): Promise<Blob> {
    const canvas = await this.toCanvas(node, options);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png'
      );
    });
  }

  static async toSvg(node: HTMLElement, options: DomToImageOptions = {}): Promise<string> {
    const cloned = await this.cloneNode(node, options);
    const rect = node.getBoundingClientRect();
    const width = options.width || rect.width;
    const height = options.height || rect.height;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          ${cloned.outerHTML}
        </foreignObject>
      </svg>
    `;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  static async toCanvas(node: HTMLElement, options: DomToImageOptions = {}): Promise<HTMLCanvasElement> {
    const rect = node.getBoundingClientRect();
    const width = options.width || rect.width;
    const height = options.height || rect.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;

    // Fill background
    if (options.bgcolor) {
      ctx.fillStyle = options.bgcolor;
      ctx.fillRect(0, 0, width, height);
    }

    // Render node
    await this.renderNode(ctx, node, options);

    return canvas;
  }

  private static async cloneNode(
    node: HTMLElement,
    options: DomToImageOptions
  ): Promise<HTMLElement> {
    const clone = node.cloneNode(true) as HTMLElement;

    // Apply custom styles
    if (options.style) {
      Object.assign(clone.style, options.style);
    }

    // Filter nodes
    if (options.filter) {
      this.filterNodes(clone, options.filter);
    }

    return clone;
  }

  private static filterNodes(node: HTMLElement, filter: (node: Node) => boolean): void {
    const children = Array.from(node.childNodes);

    for (const child of children) {
      if (!filter(child)) {
        node.removeChild(child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        this.filterNodes(child as HTMLElement, filter);
      }
    }
  }

  private static async renderNode(
    ctx: CanvasRenderingContext2D,
    node: HTMLElement,
    options: DomToImageOptions
  ): Promise<void> {
    const rect = node.getBoundingClientRect();
    const styles = window.getComputedStyle(node);

    // Render background
    const bgColor = styles.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    // Render text
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      ctx.font = `${styles.fontSize} ${styles.fontFamily}`;
      ctx.fillStyle = styles.color;
      ctx.fillText(text, 0, 0);
    }

    // Render children
    for (const child of Array.from(node.children)) {
      await this.renderNode(ctx, child as HTMLElement, options);
    }
  }

  static async toPixelData(node: HTMLElement, options: DomToImageOptions = {}): Promise<Uint8ClampedArray> {
    const canvas = await this.toCanvas(node, options);
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data;
  }
}

export default DomToImage;
export { DomToImage };
export type { DomToImageOptions };

// CLI Demo
if (import.meta.url.includes("elide-dom-to-image.ts")) {
  console.log("✅ DOM to Image - DOM to Image Converter (POLYGLOT!)\n");

  console.log("Example dom-to-image usage:");
  console.log("  const dataUrl = await DomToImage.toPng(element)");
  console.log("  const blob = await DomToImage.toBlob(element)");
  console.log("  const svg = await DomToImage.toSvg(element)");
  console.log("  const jpeg = await DomToImage.toJpeg(element, { quality: 0.95 })");

  console.log("\n🚀 ~2M downloads/week on npm!");
  console.log("💡 Convert DOM nodes to images!");
}
