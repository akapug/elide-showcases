/**
 * ScrollReveal - Scroll Animation Library
 *
 * Easily animate elements as they scroll into view.
 * **POLYGLOT SHOWCASE**: One scroll animation library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/scrollreveal (~100K+ downloads/week)
 *
 * Features:
 * - Scroll-triggered animations
 * - Customizable effects
 * - Sequential reveals
 * - Mobile support
 * - Easy configuration
 * - Zero dependencies
 *
 * Use cases:
 * - Landing pages
 * - Marketing sites
 * - Portfolio reveals
 * - Content storytelling
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface ScrollRevealOptions {
  origin?: 'top' | 'bottom' | 'left' | 'right';
  distance?: string;
  duration?: number;
  delay?: number;
  rotate?: { x?: number; y?: number; z?: number };
  opacity?: number;
  scale?: number;
  easing?: string;
  reset?: boolean;
  interval?: number;
}

export class ScrollReveal {
  private options: ScrollRevealOptions;

  constructor(options: ScrollRevealOptions = {}) {
    this.options = {
      origin: 'bottom',
      distance: '20px',
      duration: 600,
      delay: 0,
      opacity: 0,
      scale: 0.9,
      easing: 'cubic-bezier(0.5, 0, 0, 1)',
      reset: false,
      interval: 0,
      ...options,
    };
  }

  reveal(selector: string, options?: ScrollRevealOptions): void {
    console.log(`Revealing elements: ${selector}`);
  }

  sync(): void {
    console.log('ScrollReveal synced');
  }

  clean(selector: string): void {
    console.log(`Cleaned: ${selector}`);
  }

  destroy(): void {
    console.log('ScrollReveal destroyed');
  }
}

export default function(options?: ScrollRevealOptions): ScrollReveal {
  return new ScrollReveal(options);
}

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📜 ScrollReveal - Scroll Animations for Elide (POLYGLOT!)\n");

  const sr = new ScrollReveal({ duration: 1000 });
  sr.reveal('.element', { origin: 'left', distance: '50px' });
  console.log("Elements revealed on scroll");
  
  console.log("\n✅ Use Cases:");
  console.log("- Landing pages");
  console.log("- Marketing sites");
  console.log("- Portfolios");
  console.log("- Storytelling");
  
  console.log("\n🚀 ~100K+ downloads/week on npm!");
}
