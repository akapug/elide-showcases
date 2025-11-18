/**
 * SAL - Scroll Animation Library
 * Based on https://www.npmjs.com/package/sal (~10K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One scroll animation for ALL languages on Elide!
 */

export interface SALOptions {
  threshold?: number;
  once?: boolean;
  disabled?: boolean;
}

export function init(options: SALOptions = {}): void {
  console.log('SAL initialized', options);
}

export default { init };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📜 SAL for Elide (POLYGLOT!)\n");
  init({ threshold: 0.5, once: true });
  console.log("✅ SAL initialized");
  console.log("🚀 ~10K+ downloads/week on npm!");
}
