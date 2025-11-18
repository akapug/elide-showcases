/**
 * Is Unicode Supported - Detect Unicode Support
 *
 * Check if terminal supports Unicode.
 * **POLYGLOT SHOWCASE**: Unicode detection for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-unicode-supported (~10M+ downloads/week)
 *
 * Features:
 * - Detect Unicode support
 * - Terminal capability checking
 * - Environment detection
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~10M+ downloads/week on npm!
 */

export function isUnicodeSupported(): boolean {
  if (process.platform !== 'win32') {
    return process.env.TERM !== 'linux';
  }

  return Boolean(
    process.env.CI ||
    process.env.WT_SESSION ||
    process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm'
  );
}

export default isUnicodeSupported;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌐 Is Unicode Supported - Unicode Detection (POLYGLOT!)\n");

  const supported = isUnicodeSupported();
  console.log("Unicode supported:", supported);
  console.log("Platform:", process.platform);

  if (supported) {
    console.log("Can use: ✔ ✖ ★ ♥ 😀");
  } else {
    console.log("Use fallbacks: [OK] [X] * <3 :)");
  }

  console.log("\n🚀 ~10M+ downloads/week on npm!");
}
