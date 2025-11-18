/**
 * Yocto Sleep - Tiny Sleep Function
 *
 * Ultra-minimal sleep/delay utility.
 * **POLYGLOT SHOWCASE**: One sleep for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/yocto-sleep (~10K+ downloads/week)
 *
 * Features:
 * - Minimal implementation
 * - Promise-based sleep
 * - TypeScript support
 *
 * Package has ~10K+ downloads/week on npm!
 */

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default sleep;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💤 Yocto Sleep - Tiny Sleep Function (POLYGLOT!)\n");

  console.log("Sleeping for 1 second...");
  await sleep(1000);
  console.log("Awake!");

  console.log("\nCounting with delays:");
  for (let i = 1; i <= 3; i++) {
    console.log(i);
    await sleep(500);
  }

  console.log("\n✅ Ultra-minimal sleep utility!");
}
