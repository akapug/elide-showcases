/**
 * IntersectionObserver Polyfill
 *
 * Polyfill for IntersectionObserver API.
 * **POLYGLOT SHOWCASE**: IntersectionObserver for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/intersection-observer (~500K+ downloads/week)
 */

export interface IntersectionObserverEntry {
  target: Element;
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  time: number;
}

export interface IntersectionObserverInit {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export class IntersectionObserver {
  private callback: IntersectionObserverCallback;
  private options: IntersectionObserverInit;
  private targets: Set<Element> = new Set();

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.options = options;
  }

  observe(target: Element): void {
    this.targets.add(target);
    // Simulate intersection
    const entry: IntersectionObserverEntry = {
      target,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now()
    };
    this.callback([entry], this);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

export type IntersectionObserverCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;

export default IntersectionObserver;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("👁️ IntersectionObserver Polyfill (POLYGLOT!)\n");
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      console.log('Element intersecting:', entry.isIntersecting);
    });
  });
  
  console.log('Observer created');
  console.log("\n  ✓ ~500K+ downloads/week!");
}
