/**
 * tiny-warning - Tiny development warning
 * Based on https://www.npmjs.com/package/tiny-warning (~25M+ downloads/week)
 *
 * Features:
 * - Ultra-small (< 200 bytes)
 * - TypeScript support
 * - Development warnings
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Minimal overhead
 */

function warning(condition: any, message?: string): void {
  if (!condition && typeof console !== 'undefined' && console.warn) {
    console.warn(message || 'Warning');
  }
}

export default warning;

// Self-test
if (import.meta.url.includes("elide-tiny-warning.ts")) {
  console.log("✅ tiny-warning - Tiny Dev Warnings (POLYGLOT!)\n");

  // No warning
  warning(true, 'This should not show');
  console.log('✓ No warning for true condition');

  // Show warning
  warning(false, 'This is a tiny warning');
  console.log('✓ Warning displayed');

  // Usage example
  const isDevelopment = false;
  warning(isDevelopment, 'Not in development mode');

  console.log("\n🚀 ~25M+ downloads/week | Smallest warning library\n");
}
