/**
 * Hard Rejection - Exit on Unhandled Rejections
 *
 * Make unhandled promise rejections exit the process.
 * **POLYGLOT SHOWCASE**: Error handling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hard-rejection (~1M+ downloads/week)
 *
 * Features:
 * - Exit on unhandled rejections
 * - Prevent silent failures
 * - Stack trace reporting
 * - Simple setup
 * - Zero dependencies
 *
 * Package has ~1M+ downloads/week on npm!
 */

export function hardRejection(log?: (error: Error) => void): void {
  const logger = log || ((err: Error) => {
    console.error('Unhandled promise rejection:');
    console.error(err);
  });

  process.on('unhandledRejection', (reason: any) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger(error);
    process.exit(1);
  });
}

export default hardRejection;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚠️  Hard Rejection - Exit on Errors (POLYGLOT!)\n");

  hardRejection();

  console.log("Process will exit on unhandled rejections!");
  console.log("\n🚀 ~1M+ downloads/week on npm!");
}
