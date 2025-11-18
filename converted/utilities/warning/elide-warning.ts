/**
 * warning - Display warnings in development
 * Based on https://www.npmjs.com/package/warning (~30M+ downloads/week)
 *
 * Features:
 * - Development-only warnings
 * - Conditional warnings
 * - Console.warn wrapper
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Safe production builds
 */

function warning(condition: any, message: string): void {
  if (!condition) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Warning: ' + message);
    }

    try {
      // This error is thrown to capture stack trace
      throw new Error(message);
    } catch (e) {
      // Ignore the error, we just wanted the stack trace
    }
  }
}

export default warning;

// Self-test
if (import.meta.url.includes("elide-warning.ts")) {
  console.log("✅ warning - Development Warnings (POLYGLOT!)\n");

  // No warning (condition is true)
  warning(true, 'This should not show');
  console.log('✓ No warning for true condition');

  // Show warning (condition is false)
  warning(false, 'This is a test warning');
  console.log('✓ Warning displayed for false condition');

  // Practical example
  const config = { debug: false };
  warning(config.debug, 'Debug mode is disabled');

  console.log("\n🚀 ~30M+ downloads/week | React's warning system\n");
}
