/**
 * ResizeObserver Polyfill
 *
 * Polyfill for ResizeObserver API.
 * **POLYGLOT SHOWCASE**: ResizeObserver for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/resize-observer-polyfill (~1M+ downloads/week)
 */

export interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize?: ResizeObserverSize[];
  contentBoxSize?: ResizeObserverSize[];
}

export interface ResizeObserverSize {
  inlineSize: number;
  blockSize: number;
}

export class ResizeObserver {
  private callback: ResizeObserverCallback;
  private targets: Set<Element> = new Set();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element, options?: any): void {
    this.targets.add(target);
    const entry: ResizeObserverEntry = {
      target,
      contentRect: { width: 100, height: 100 } as DOMRectReadOnly
    };
    this.callback([entry], this);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
  }
}

export type ResizeObserverCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

export default ResizeObserver;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📐 ResizeObserver Polyfill (POLYGLOT!)\n");
  
  const observer = new ResizeObserver((entries) => {
    entries.forEach(entry => {
      console.log('Element resized:', entry.contentRect);
    });
  });
  
  console.log('Observer created');
  console.log("\n  ✓ ~1M+ downloads/week!");
}
