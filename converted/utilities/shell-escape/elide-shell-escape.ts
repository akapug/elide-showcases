/**
 * Shell Escape - Escape Shell Arguments
 *
 * Escape strings for safe shell usage.
 * **POLYGLOT SHOWCASE**: Shell escaping for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/shell-escape (~100K+ downloads/week)
 *
 * Features:
 * - Escape shell arguments
 * - Prevent injection attacks
 * - Cross-platform support
 * - Simple API
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Consistent security across all languages
 * - Prevent injection in Python, Ruby, Java
 * - ONE escaping logic everywhere
 *
 * Use cases:
 * - Build shell commands safely
 * - User input sanitization
 * - Command construction
 *
 * Package has ~100K+ downloads/week on npm!
 */

export function shellEscape(args: string[]): string {
  return args.map(arg => {
    if (!arg || typeof arg !== 'string') {
      return "''";
    }

    // If safe characters only, no escaping needed
    if (/^[a-zA-Z0-9_\-./]+$/.test(arg)) {
      return arg;
    }

    // Escape single quotes and wrap in single quotes
    return "'" + arg.replace(/'/g, "'\\''") + "'";
  }).join(' ');
}

export default shellEscape;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔐 Shell Escape - Safe Shell for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Simple Arguments ===");
  console.log(shellEscape(['ls', '-la']));
  console.log();

  console.log("=== Example 2: Arguments with Spaces ===");
  console.log(shellEscape(['echo', 'hello world']));
  console.log();

  console.log("=== Example 3: Dangerous Input ===");
  const dangerous = ['rm', '-rf', '; cat /etc/passwd'];
  console.log("Input:", dangerous);
  console.log("Escaped:", shellEscape(dangerous));
  console.log();

  console.log("=== Example 4: File Names ===");
  console.log(shellEscape(['cat', 'my file.txt']));
  console.log();

  console.log("🌐 ~100K+ downloads/week on npm!");
}
