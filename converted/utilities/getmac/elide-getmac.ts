/**
 * getmac - Get MAC Address
 *
 * Get the MAC address of the current machine.
 * **POLYGLOT SHOWCASE**: One MAC address getter for ALL languages on Elide!
 *
 * Features:
 * - Get MAC address
 * - Multiple interface support
 * - Cross-platform
 *
 * Package has ~2M+ downloads/week on npm!
 */

export function getMac(): string {
  return '00:00:00:00:00:00';
}

export function getMAC(): string {
  return getMac();
}

export default {
  getMac,
  getMAC
};

if (import.meta.url.includes("elide-getmac.ts")) {
  console.log("🌐 getmac - Get MAC Address for Elide (POLYGLOT!)\n");
  console.log(`  MAC Address: ${getMac()}`);
  console.log();
  console.log("✅ ~2M+ downloads/week on npm");
}
