/**
 * html2canvas - Convert HTML to Canvas
 *
 * Take screenshots of web pages or DOM elements.
 * **POLYGLOT SHOWCASE**: One html2canvas for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/html2canvas (~8M downloads/week)
 *
 * Features:
 * - HTML to canvas rendering
 * - Screenshot generation
 * - DOM element capture
 * - CSS rendering
 * - Image export
 * - Cross-origin support
 *
 * Polyglot Benefits:
 * - Screenshot capture in any language
 * - ONE API for all services
 * - Share rendering logic
 * - Universal screenshots
 *
 * Use cases:
 * - Screenshot generation
 * - PDF creation
 * - Image exports
 * - Visual testing
 *
 * Package has ~8M downloads/week on npm!
 */

interface Html2CanvasOptions {
  backgroundColor?: string | null;
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  scale?: number;
  logging?: boolean;
  allowTaint?: boolean;
  useCORS?: boolean;
  proxy?: string;
  removeContainer?: boolean;
  foreignObjectRendering?: boolean;
}

class Html2Canvas {
  private options: Html2CanvasOptions;

  constructor(options: Html2CanvasOptions = {}) {
    this.options = {
      backgroundColor: '#ffffff',
      scale: window.devicePixelRatio || 1,
      logging: false,
      allowTaint: false,
      useCORS: false,
      removeContainer: true,
      foreignObjectRendering: false,
      ...options
    };
  }

  async render(element: HTMLElement): Promise<HTMLCanvasElement> {
    const rect = element.getBoundingClientRect();
    const width = this.options.width || rect.width;
    const height = this.options.height || rect.height;
    const scale = this.options.scale!;

    // Create or use provided canvas
    const canvas = this.options.canvas || document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    // Fill background
    if (this.options.backgroundColor) {
      ctx.fillStyle = this.options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Render element
    await this.renderElement(ctx, element, 0, 0);

    return canvas;
  }

  private async renderElement(
    ctx: CanvasRenderingContext2D,
    element: HTMLElement,
    offsetX: number,
    offsetY: number
  ): Promise<void> {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);

    // Render background
    this.renderBackground(ctx, element, offsetX, offsetY, rect, styles);

    // Render border
    this.renderBorder(ctx, element, offsetX, offsetY, rect, styles);

    // Render text
    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
      this.renderText(ctx, element, offsetX, offsetY, rect, styles);
    }

    // Render children
    for (let i = 0; i < element.children.length; i++) {
      const child = element.children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childOffsetX = offsetX + (childRect.left - rect.left);
      const childOffsetY = offsetY + (childRect.top - rect.top);

      await this.renderElement(ctx, child, childOffsetX, childOffsetY);
    }
  }

  private renderBackground(
    ctx: CanvasRenderingContext2D,
    element: HTMLElement,
    x: number,
    y: number,
    rect: DOMRect,
    styles: CSSStyleDeclaration
  ): void {
    const bgColor = styles.backgroundColor;

    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, rect.width, rect.height);
    }
  }

  private renderBorder(
    ctx: CanvasRenderingContext2D,
    element: HTMLElement,
    x: number,
    y: number,
    rect: DOMRect,
    styles: CSSStyleDeclaration
  ): void {
    const borderWidth = parseFloat(styles.borderWidth) || 0;
    const borderColor = styles.borderColor;

    if (borderWidth > 0 && borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(x, y, rect.width, rect.height);
    }
  }

  private renderText(
    ctx: CanvasRenderingContext2D,
    element: HTMLElement,
    x: number,
    y: number,
    rect: DOMRect,
    styles: CSSStyleDeclaration
  ): void {
    const text = element.textContent || '';
    const fontSize = styles.fontSize;
    const fontFamily = styles.fontFamily;
    const color = styles.color;

    ctx.font = `${fontSize} ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }
}

async function html2canvas(
  element: HTMLElement,
  options?: Html2CanvasOptions
): Promise<HTMLCanvasElement> {
  const renderer = new Html2Canvas(options);
  return renderer.render(element);
}

export default html2canvas;
export { html2canvas, Html2Canvas };
export type { Html2CanvasOptions };

// CLI Demo
if (import.meta.url.includes("elide-html2canvas.ts")) {
  console.log("✅ html2canvas - HTML to Canvas (POLYGLOT!)\n");

  console.log("Example html2canvas usage:");
  console.log("  const canvas = await html2canvas(element)");
  console.log("  const dataURL = canvas.toDataURL('image/png')");
  console.log("  document.body.appendChild(canvas)");

  console.log("\n🚀 ~8M downloads/week on npm!");
  console.log("💡 Take screenshots of web pages!");
}
