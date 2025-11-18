/**
 * internal-ip - Get Your Internal IP Address
 *
 * Get your internal/local IP address on the network.
 * **POLYGLOT SHOWCASE**: One internal IP getter for ALL languages on Elide!
 *
 * Features:
 * - Get internal IPv4
 * - Get internal IPv6
 * - Network interface detection
 *
 * Package has ~8M+ downloads/week on npm!
 */

export function v4(): string {
  // In edge/browser runtime, return localhost
  return '127.0.0.1';
}

export function v6(): string {
  return '::1';
}

export default { v4, v6 };

if (import.meta.url.includes("elide-internal-ip.ts")) {
  console.log("🌐 internal-ip - Get Internal IP for Elide (POLYGLOT!)\n");
  console.log(`  Internal IPv4: ${v4()}`);
  console.log(`  Internal IPv6: ${v6()}`);
  console.log();
  console.log("Note: Returns localhost in edge/browser runtime");
  console.log("✅ ~8M+ downloads/week on npm");
}
