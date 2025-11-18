/**
 * Loud Rejection - Make Unhandled Rejections Fail Loudly
 *
 * Detect and report unhandled promise rejections.
 * **POLYGLOT SHOWCASE**: Error handling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/loud-rejection (~500K+ downloads/week)
 *
 * Features:
 * - Detect unhandled rejections
 * - Fail loudly on errors
 * - Stack trace reporting
 * - Easy setup
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function loudRejection(log?: (error: Error) => void): void {
  const logger = log || console.error.bind(console);

  process.on('unhandledRejection', (reason: any) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger(error);
    process.exit(1);
  });
}

export default loudRejection;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔊 Loud Rejection - Fail Loudly (POLYGLOT!)\n");

  loudRejection();

  console.log("Unhandled rejections will now fail loudly!");
  console.log("\nTry:");
  console.log("Promise.reject(new Error('Test error'));");

  console.log("\n🚀 ~500K+ downloads/week on npm!");
}
