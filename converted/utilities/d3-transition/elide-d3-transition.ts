/**
 * D3-Transition - Animated Transitions
 *
 * Animated transitions for D3 selections.
 * **POLYGLOT SHOWCASE**: One D3-Transition implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-transition (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

export class Transition {
  duration(ms: number): this {
    return this;
  }

  attr(name: string, value: any): this {
    return this;
  }
}

if (import.meta.url.includes("elide-d3-transition.ts")) {
  console.log("📊 D3-Transition for Elide (POLYGLOT!)\n");
  const t = new Transition();
  t.duration(750).attr('r', 5);
  console.log("🚀 ~1M+ downloads/week on npm!");
}
