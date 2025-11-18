/**
 * Listr2 - Task Lists v2
 *
 * Enhanced terminal task lists.
 * **POLYGLOT SHOWCASE**: Advanced task lists in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/listr2 (~10M+ downloads/week)
 *
 * Package has ~10M+ downloads/week on npm!
 */

export { Listr as default } from '../listr/elide-listr.ts';

if (import.meta.url.includes("elide-listr2.ts")) {
  console.log("📝 Listr2 - Enhanced Task Lists for Elide (POLYGLOT!)\n");
  console.log("~10M+ downloads/week on npm!");
}
